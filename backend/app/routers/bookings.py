from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Business, Booking
from app.db import booking_to_dict
from app.schemas import BookingCreate
from app.security import require_owner

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


def _parse_hm(s: str) -> int:
    h, m = s.split(":")
    return int(h) * 60 + int(m)


def _fmt_hm(mins: int) -> str:
    return f"{mins // 60:02d}:{mins % 60:02d}"


def _find_service(business: Business, name: str) -> dict | None:
    for s in (business.services or []):
        if s["name"] == name:
            return s
    return None


@router.get("/availability")
def availability(business_id: int, service_name: str, date: str, db: Session = Depends(get_db)):
    b = db.get(Business, business_id)
    if not b or b.status != "approved":
        raise HTTPException(404, "Biznes tapılmadı")
    svc = _find_service(b, service_name)
    if not svc:
        raise HTTPException(404, "Xidmət tapılmadı")

    try:
        dt = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(400, "Tarix yanlışdır")
    if dt.date() < datetime.now().date():
        return {"slots": []}
    weekday = dt.weekday()

    if any(cd["date"] == date for cd in (b.closed_days or [])):
        return {"slots": []}

    hours = next((h for h in (b.working_hours or []) if h["day"] == weekday and h["is_open"]), None)
    if not hours:
        return {"slots": []}

    start = _parse_hm(hours["start"])
    end = _parse_hm(hours["end"])
    duration = int(svc["duration_min"])

    now = datetime.now()
    if dt.date() == now.date():
        start = max(start, now.hour * 60 + now.minute)

    taken: list[tuple[int, int]] = []
    for br in hours.get("breaks", []):
        taken.append((_parse_hm(br["start"]), _parse_hm(br["end"])))

    for bk in db.query(Booking).filter(
        Booking.business_id == business_id, Booking.date == date, Booking.status != "cancelled"
    ).all():
        s = _parse_hm(bk.start_time)
        taken.append((s, s + bk.duration_min))
    taken.sort()

    windows: list[tuple[int, int]] = []
    cursor = start
    for s, e in taken:
        if s > cursor:
            windows.append((cursor, min(s, end)))
        cursor = max(cursor, e)
    if cursor < end:
        windows.append((cursor, end))

    slots: list[str] = []
    for ws, we in windows:
        t = ws
        while t + duration <= we:
            slots.append(_fmt_hm(t))
            t += duration
    return {"slots": slots, "duration_min": duration}


@router.post("")
def create_booking(payload: BookingCreate, db: Session = Depends(get_db)):
    b = db.get(Business, payload.business_id)
    if not b or b.status != "approved":
        raise HTTPException(404, "Biznes tapılmadı")
    svc = _find_service(b, payload.service_name)
    if not svc:
        raise HTTPException(404, "Xidmət tapılmadı")

    try:
        booking_dt = datetime.strptime(f"{payload.date} {payload.start_time}", "%Y-%m-%d %H:%M")
    except ValueError:
        raise HTTPException(400, "Tarix və ya vaxt yanlışdır")
    if booking_dt < datetime.now():
        raise HTTPException(400, "Keçmiş vaxta rezervasiya mümkün deyil")

    avail = availability(payload.business_id, payload.service_name, payload.date, db)
    if payload.start_time not in avail["slots"]:
        raise HTTPException(400, "Bu vaxt artıq dolub")

    bk = Booking(
        business_id=payload.business_id,
        service_name=payload.service_name,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        date=payload.date,
        start_time=payload.start_time,
        duration_min=svc["duration_min"],
        status="confirmed",
    )
    db.add(bk)
    db.commit()
    db.refresh(bk)
    return booking_to_dict(bk)


@router.get("/business/{business_id}")
def list_business_bookings(business_id: int, db: Session = Depends(get_db)):
    rows = db.query(Booking).filter(Booking.business_id == business_id).order_by(Booking.date.desc(), Booking.start_time.desc()).all()
    return [booking_to_dict(bk) for bk in rows]


@router.get("/stats/{business_id}")
def booking_stats(business_id: int, db: Session = Depends(get_db), user=Depends(require_owner)):
    b = db.get(Business, business_id)
    if not b or b.owner_id != user.id:
        raise HTTPException(403, "Bu biznes sizə aid deyil")

    now = datetime.now()
    today = now.strftime("%Y-%m-%d")
    week_start = (now - __import__("datetime").timedelta(days=now.weekday())).strftime("%Y-%m-%d")
    month_start = now.strftime("%Y-%m-01")

    all_bookings = db.query(Booking).filter(
        Booking.business_id == business_id,
        Booking.status != "cancelled",
    ).all()

    svc_map = {s["name"]: s for s in (b.services or [])}

    def revenue(bk):
        svc = svc_map.get(bk.service_name)
        return svc["price_min"] if svc else 0

    today_bk = [x for x in all_bookings if x.date == today]
    week_bk = [x for x in all_bookings if x.date >= week_start]
    month_bk = [x for x in all_bookings if x.date >= month_start]

    # daily breakdown for last 30 days
    from collections import defaultdict
    daily = defaultdict(lambda: {"count": 0, "revenue": 0})
    for bk in all_bookings:
        if bk.date >= (now - __import__("datetime").timedelta(days=30)).strftime("%Y-%m-%d"):
            daily[bk.date]["count"] += 1
            daily[bk.date]["revenue"] += revenue(bk)

    # by service
    by_service = defaultdict(lambda: {"count": 0, "revenue": 0})
    for bk in all_bookings:
        by_service[bk.service_name]["count"] += 1
        by_service[bk.service_name]["revenue"] += revenue(bk)

    # weekday vs weekend
    weekday_rev = 0
    weekend_rev = 0
    for bk in month_bk:
        try:
            d = datetime.strptime(bk.date, "%Y-%m-%d")
            r = revenue(bk)
            if d.weekday() < 5:
                weekday_rev += r
            else:
                weekend_rev += r
        except ValueError:
            pass

    # by hour
    by_hour = defaultdict(int)
    for bk in all_bookings:
        try:
            h = int(bk.start_time.split(":")[0])
            by_hour[h] += 1
        except (ValueError, AttributeError):
            pass

    return {
        "today": {"count": len(today_bk), "revenue": sum(revenue(x) for x in today_bk)},
        "week": {"count": len(week_bk), "revenue": sum(revenue(x) for x in week_bk)},
        "month": {"count": len(month_bk), "revenue": sum(revenue(x) for x in month_bk)},
        "total": {"count": len(all_bookings), "revenue": sum(revenue(x) for x in all_bookings)},
        "weekday_revenue": weekday_rev,
        "weekend_revenue": weekend_rev,
        "daily": [{"date": k, **v} for k, v in sorted(daily.items())],
        "by_service": [{"name": k, **v} for k, v in sorted(by_service.items(), key=lambda x: -x[1]["revenue"])],
        "by_hour": [{"hour": h, "count": c} for h, c in sorted(by_hour.items())],
    }


@router.patch("/{booking_id}/status")
def update_booking_status(booking_id: int, payload: dict, db: Session = Depends(get_db), user=Depends(require_owner)):
    bk = db.get(Booking, booking_id)
    if not bk:
        raise HTTPException(404, "Rezervasiya tapılmadı")
    b = db.get(Business, bk.business_id)
    if not b or b.owner_id != user.id:
        raise HTTPException(403, "Bu biznes sizə aid deyil")
    status = payload.get("status")
    if status not in ("confirmed", "completed", "cancelled", "no_show"):
        raise HTTPException(400, "Yanlış status")
    bk.status = status
    db.commit()
    db.refresh(bk)
    return booking_to_dict(bk)


@router.get("/daily/{business_id}")
def daily_schedule(business_id: int, date: str, db: Session = Depends(get_db), user=Depends(require_owner)):
    b = db.get(Business, business_id)
    if not b or b.owner_id != user.id:
        raise HTTPException(403, "Bu biznes sizə aid deyil")
    rows = db.query(Booking).filter(
        Booking.business_id == business_id,
        Booking.date == date,
    ).order_by(Booking.start_time).all()

    # get working hours for the day
    try:
        dt = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(400, "Tarix yanlışdır")
    weekday = dt.weekday()
    hours = next((h for h in (b.working_hours or []) if h["day"] == weekday and h["is_open"]), None)

    return {
        "date": date,
        "working_hours": hours,
        "bookings": [booking_to_dict(bk) for bk in rows],
    }


@router.post("/owner")
def owner_create_booking(payload: BookingCreate, db: Session = Depends(get_db), user=Depends(require_owner)):
    b = db.get(Business, payload.business_id)
    if not b or b.owner_id != user.id:
        raise HTTPException(403, "Bu biznes sizə aid deyil")
    svc = _find_service(b, payload.service_name)
    if not svc:
        raise HTTPException(404, "Xidmət tapılmadı")

    avail = availability(payload.business_id, payload.service_name, payload.date, db)
    if payload.start_time not in avail["slots"]:
        raise HTTPException(400, "Bu vaxt artıq dolub")

    bk = Booking(
        business_id=payload.business_id,
        service_name=payload.service_name,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        date=payload.date,
        start_time=payload.start_time,
        duration_min=svc["duration_min"],
        status="confirmed",
    )
    db.add(bk)
    db.commit()
    db.refresh(bk)
    return booking_to_dict(bk)
