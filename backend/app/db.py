"""Static data (categories) + business<->dict converters."""
from typing import Any
from app.models import Business, Booking, User

CATEGORIES = [
    {"id": 1, "slug": "berber", "name": "Bərbər"},
    {"id": 2, "slug": "gozellik", "name": "Gözəllik Salonu"},
    {"id": 3, "slug": "restoran", "name": "Restoran"},
    {"id": 4, "slug": "stomatoloq", "name": "Stomatoloq"},
    {"id": 5, "slug": "avtoyuma", "name": "Avtoyuma"},
]

SERVICES_BY_CATEGORY = {
    "berber": ["Saç kəsimi", "Saqqal düzəltmə", "Uşaq saç kəsimi", "Saç boyama", "Üz baxımı"],
    "gozellik": ["Manikür", "Pedikür", "Makiyaj", "Kirpik", "Qaş"],
    "restoran": ["Masa rezervasiyası"],
    "stomatoloq": ["Müayinə", "Təmizlik", "Plomb", "Diş çəkilməsi"],
    "avtoyuma": ["Sadə yuma", "Kompleks yuma", "Salon təmizliyi"],
}


def business_to_dict(b: Business) -> dict[str, Any]:
    return {
        "id": b.id,
        "owner_id": b.owner_id,
        "name": b.name,
        "voen": b.voen,
        "category_slug": b.category_slug,
        "slug": b.slug,
        "about": b.about,
        "location": {"lat": b.lat, "lng": b.lng, "address": b.address},
        "contact_email": b.contact_email,
        "contact_phone": b.contact_phone,
        "status": b.status,
        "note": b.note,
        "services": b.services or [],
        "images": b.images or [],
        "working_hours": b.working_hours or [],
        "closed_days": b.closed_days or [],
    }


def booking_to_dict(bk: Booking) -> dict[str, Any]:
    return {
        "id": bk.id,
        "business_id": bk.business_id,
        "service_name": bk.service_name,
        "customer_name": bk.customer_name,
        "customer_phone": bk.customer_phone,
        "date": bk.date,
        "start_time": bk.start_time,
        "duration_min": bk.duration_min,
        "status": bk.status,
    }


def user_public(u: User) -> dict:
    return {"id": u.id, "email": u.email, "role": u.role, "voen": u.voen}
