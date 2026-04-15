"""Static data (categories) + business<->dict converters."""
from typing import Any
from app.models import Business, Booking, User

CATEGORIES = [
    {"id": 1, "slug": "berber", "name": "Bərbər", "icon": "💈"},
    {"id": 2, "slug": "gozellik", "name": "Gözəllik Salonu", "icon": "💄"},
    {"id": 3, "slug": "restoran", "name": "Restoran", "icon": "🍽️"},
    {"id": 4, "slug": "stomatoloq", "name": "Stomatoloq", "icon": "🦷"},
    {"id": 5, "slug": "avtoyuma", "name": "Avtoyuma", "icon": "🚗"},
    {"id": 6, "slug": "fitnes", "name": "Fitnes Klubu", "icon": "🏋️"},
    {"id": 7, "slug": "yoga", "name": "Yoga Studiyası", "icon": "🧘"},
    {"id": 8, "slug": "masaj", "name": "Masaj Salonu", "icon": "💆"},
    {"id": 9, "slug": "spa", "name": "SPA Mərkəzi", "icon": "🧖"},
    {"id": 10, "slug": "həkim", "name": "Həkim / Klinika", "icon": "🩺"},
    {"id": 11, "slug": "veteriner", "name": "Veteriner", "icon": "🐾"},
    {"id": 12, "slug": "foto", "name": "Foto Studiya", "icon": "📸"},
    {"id": 13, "slug": "tatuaj", "name": "Tatuaj / Piercing", "icon": "🎨"},
    {"id": 14, "slug": "təmizlik", "name": "Təmizlik xidməti", "icon": "🧹"},
    {"id": 15, "slug": "tədris", "name": "Tədris Mərkəzi", "icon": "📚"},
    {"id": 16, "slug": "musiqi", "name": "Musiqi Dərsləri", "icon": "🎵"},
    {"id": 17, "slug": "rəqs", "name": "Rəqs Studiyası", "icon": "💃"},
    {"id": 18, "slug": "uşaq", "name": "Uşaq Mərkəzi", "icon": "🧒"},
    {"id": 19, "slug": "kafe", "name": "Kafe", "icon": "☕"},
    {"id": 20, "slug": "avtoservis", "name": "Avtoservis", "icon": "🔧"},
]

SERVICES_BY_CATEGORY = {
    "berber": ["Saç kəsimi", "Saqqal düzəltmə", "Uşaq saç kəsimi", "Saç boyama", "Üz baxımı"],
    "gozellik": ["Manikür", "Pedikür", "Makiyaj", "Kirpik", "Qaş", "Saç düzümü"],
    "restoran": ["Masa rezervasiyası", "VIP zal"],
    "stomatoloq": ["Müayinə", "Təmizlik", "Plomb", "Diş çəkilməsi", "İmplant"],
    "avtoyuma": ["Sadə yuma", "Kompleks yuma", "Salon təmizliyi"],
    "fitnes": ["Şəxsi məşqçi", "Qrup məşqi", "Bir günlük giriş"],
    "yoga": ["Hatha Yoga", "Vinyasa", "Meditasiya"],
    "masaj": ["Klassik masaj", "Tay masajı", "Limfodrenaj"],
    "spa": ["SPA paketi", "Sauna", "Hamam"],
    "həkim": ["Müayinə", "Konsultasiya", "USM"],
    "veteriner": ["Müayinə", "Peyvənd", "Cərrahiyə"],
    "foto": ["Studiya çəkilişi", "Ailə çəkilişi", "Məhsul çəkilişi"],
    "tatuaj": ["Kiçik tatu", "Orta tatu", "Piercing"],
    "təmizlik": ["Mənzil təmizliyi", "Ofis təmizliyi", "Şüşə təmizliyi"],
    "tədris": ["Fərdi dərs", "Qrup dərsi", "Konsultasiya"],
    "musiqi": ["Gitara dərsi", "Piano dərsi", "Vokal"],
    "rəqs": ["Latın", "Hip-hop", "Bal rəqsləri"],
    "uşaq": ["İnkişaf dərsi", "Doğum günü", "Oyun zonası"],
    "kafe": ["Masa rezervasiyası"],
    "avtoservis": ["Diaqnostika", "Yağ dəyişimi", "Təkər balansı"],
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
