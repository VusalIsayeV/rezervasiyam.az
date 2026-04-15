from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Business, Booking
from app.db import booking_to_dict
from app.schemas import BookingCreate

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
    rows = db.query(Booking).filter(Booking.business_id == business_id).all()
    return [booking_to_dict(bk) for bk in rows]
