from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Business, User
from app import db as static
from app.db import business_to_dict
from app.schemas import BusinessCreate, WorkingHoursIn, ApproveIn, ServiceItem, ClosedDayIn
from app.security import require_mentor, require_owner

router = APIRouter(prefix="/api", tags=["business"])


def _my_business(db: Session, user: User) -> Business:
    b = db.query(Business).filter(Business.owner_id == user.id).first()
    if not b:
        raise HTTPException(404, "Biznes yoxdur")
    return b


@router.get("/categories")
def list_categories():
    return {"categories": static.CATEGORIES, "services_by_category": static.SERVICES_BY_CATEGORY}


@router.post("/businesses")
def create_business(payload: BusinessCreate, db: Session = Depends(get_db), user: User = Depends(require_owner)):
    if not any(c["slug"] == payload.category_slug for c in static.CATEGORIES):
        raise HTTPException(400, "Kateqoriya mövcud deyil")
    slug = payload.slug.lower()
    if db.query(Business).filter(Business.slug == slug).first():
        raise HTTPException(400, "Bu subdomen artıq mövcuddur")
    if db.query(Business).filter(Business.owner_id == user.id).first():
        raise HTTPException(400, "Sizin artıq biznesiniz var")
    names = [s.name.strip().lower() for s in payload.services]
    if len(names) != len(set(names)):
        raise HTTPException(400, "Təkrarlanan xidmət adları var")

    b = Business(
        owner_id=user.id,
        name=payload.name,
        voen=payload.voen,
        category_slug=payload.category_slug,
        slug=slug,
        about=payload.about,
        lat=payload.location.lat,
        lng=payload.location.lng,
        address=payload.location.address,
        contact_email=payload.contact_email,
        contact_phone=payload.contact_phone,
        services=[s.model_dump() for s in payload.services],
        images=payload.images,
        status="pending",
        working_hours=[
            {"day": d, "is_open": d < 6, "start": "09:00", "end": "18:00", "breaks": []}
            for d in range(7)
        ],
        closed_days=[],
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return business_to_dict(b)


@router.get("/businesses/mine")
def my_business(db: Session = Depends(get_db), user: User = Depends(require_owner)):
    b = db.query(Business).filter(Business.owner_id == user.id).first()
    return business_to_dict(b) if b else None


@router.get("/businesses/pending")
def pending_businesses(db: Session = Depends(get_db), _: User = Depends(require_mentor)):
    return [business_to_dict(b) for b in db.query(Business).filter(Business.status == "pending").all()]


@router.get("/businesses")
def all_businesses(
    db: Session = Depends(get_db),
    q: str | None = None,
    category: str | None = None,
    lat: float | None = None,
    lng: float | None = None,
):
    query = db.query(Business).filter(Business.status == "approved")
    if category:
        query = query.filter(Business.category_slug == category)
    if q:
        like = f"%{q.lower()}%"
        from sqlalchemy import or_, func
        query = query.filter(or_(
            func.lower(Business.name).like(like),
            func.lower(Business.address).like(like),
        ))
    items = [business_to_dict(b) for b in query.all()]

    if lat is not None and lng is not None:
        import math
        def dist(b):
            if b["location"]["lat"] is None or b["location"]["lng"] is None:
                return float("inf")
            dlat = math.radians(b["location"]["lat"] - lat)
            dlng = math.radians(b["location"]["lng"] - lng)
            a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat)) * math.cos(math.radians(b["location"]["lat"])) * math.sin(dlng / 2) ** 2
            return 6371 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        for it in items:
            it["distance_km"] = round(dist(it), 2)
        items.sort(key=lambda x: x["distance_km"])
    return items


@router.get("/businesses/by-slug/{slug}")
def get_by_slug(slug: str, db: Session = Depends(get_db)):
    b = db.query(Business).filter(Business.slug == slug, Business.status == "approved").first()
    if not b:
        raise HTTPException(404, "Biznes tapılmadı")
    return business_to_dict(b)


@router.get("/businesses/all")
def all_businesses_admin(db: Session = Depends(get_db), _: User = Depends(require_mentor)):
    return [business_to_dict(b) for b in db.query(Business).order_by(Business.id.desc()).all()]


@router.post("/businesses/{bid}/status")
def set_status(bid: int, payload: dict, db: Session = Depends(get_db), _: User = Depends(require_mentor)):
    b = db.get(Business, bid)
    if not b:
        raise HTTPException(404, "Tapılmadı")
    status = payload.get("status")
    if status not in ("pending", "approved", "rejected", "disabled"):
        raise HTTPException(400, "Yanlış status")
    b.status = status
    db.commit()
    db.refresh(b)
    return business_to_dict(b)


@router.delete("/businesses/{bid}")
def delete_business(bid: int, db: Session = Depends(get_db), _: User = Depends(require_mentor)):
    b = db.get(Business, bid)
    if not b:
        raise HTTPException(404, "Tapılmadı")
    db.delete(b)
    db.commit()
    return {"ok": True}


@router.post("/businesses/{bid}/approve")
def approve_business(bid: int, payload: ApproveIn, db: Session = Depends(get_db), _: User = Depends(require_mentor)):
    b = db.get(Business, bid)
    if not b:
        raise HTTPException(404, "Tapılmadı")
    b.status = "approved" if payload.approve else "rejected"
    b.note = payload.note
    db.commit()
    db.refresh(b)
    return business_to_dict(b)


@router.put("/businesses/mine/services")
def set_services(services: list[ServiceItem], db: Session = Depends(get_db), user: User = Depends(require_owner)):
    b = _my_business(db, user)
    b.services = [s.model_dump() for s in services]
    db.commit()
    db.refresh(b)
    return business_to_dict(b)


@router.put("/businesses/mine/hours")
def set_hours(hours: list[WorkingHoursIn], db: Session = Depends(get_db), user: User = Depends(require_owner)):
    b = _my_business(db, user)
    b.working_hours = [h.model_dump() for h in hours]
    db.commit()
    db.refresh(b)
    return business_to_dict(b)


@router.put("/businesses/mine/closed-days")
def set_closed_days(days: list[ClosedDayIn], db: Session = Depends(get_db), user: User = Depends(require_owner)):
    b = _my_business(db, user)
    b.closed_days = [d.model_dump() for d in days]
    db.commit()
    db.refresh(b)
    return business_to_dict(b)
