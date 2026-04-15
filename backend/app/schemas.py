from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional
import re

PHONE_RE = re.compile(r"^(\+994|0)(50|51|55|70|77|10|99|60|66)\d{7}$")
VOEN_RE = re.compile(r"^\d{10}$")
TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _norm_phone(v: str) -> str:
    v = re.sub(r"[\s\-()]", "", v)
    if not PHONE_RE.match(v):
        raise ValueError("Telefon nömrəsi düzgün deyil (məs: +994501234567)")
    return v


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    voen: Optional[str] = None

    @field_validator("voen")
    @classmethod
    def _voen(cls, v):
        if v in (None, ""):
            return None
        if not VOEN_RE.match(v):
            raise ValueError("VOEN 10 rəqəmdən ibarət olmalıdır")
        return v


class LoginIn(BaseModel):
    identifier: str = Field(min_length=3)
    password: str = Field(min_length=1)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class LocationIn(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    address: str = Field(min_length=3, max_length=255)


class ServiceItem(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    price_min: float = Field(ge=0, le=100000)
    price_max: Optional[float] = Field(default=None, ge=0, le=100000)
    duration_min: int = Field(default=30, ge=5, le=600)

    @model_validator(mode="after")
    def _check_price(self):
        if self.price_max is not None and self.price_max < self.price_min:
            raise ValueError("Max qiymət min qiymətdən kiçik ola bilməz")
        return self


class BusinessCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    voen: Optional[str] = None
    category_slug: str
    location: LocationIn
    about: str = Field(min_length=10, max_length=1000)
    services: list[ServiceItem] = Field(min_length=1, max_length=50)
    images: list[str] = Field(default_factory=list, max_length=10)
    contact_email: EmailStr
    contact_phone: str
    slug: str = Field(min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_-]+$")

    @field_validator("voen")
    @classmethod
    def _voen(cls, v):
        if v in (None, ""):
            return None
        if not VOEN_RE.match(v):
            raise ValueError("VOEN 10 rəqəmdən ibarət olmalıdır")
        return v

    @field_validator("contact_phone")
    @classmethod
    def _phone(cls, v):
        return _norm_phone(v)


class BreakIn(BaseModel):
    start: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    end: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")

    @model_validator(mode="after")
    def _check(self):
        if self.end <= self.start:
            raise ValueError("Fasilə bitmə vaxtı başlanğıcdan sonra olmalıdır")
        return self


class WorkingHoursIn(BaseModel):
    day: int = Field(ge=0, le=6)
    start: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    end: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    is_open: bool = True
    breaks: list[BreakIn] = []

    @model_validator(mode="after")
    def _check(self):
        if self.is_open and self.end <= self.start:
            raise ValueError("İş bitmə saatı başlanğıcdan sonra olmalıdır")
        for br in self.breaks:
            if br.start < self.start or br.end > self.end:
                raise ValueError("Fasilə iş saatları daxilində olmalıdır")
        return self


class ClosedDayIn(BaseModel):
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    reason: Optional[str] = Field(default=None, max_length=200)


class BookingCreate(BaseModel):
    business_id: int = Field(gt=0)
    service_name: str = Field(min_length=1)
    customer_name: str = Field(min_length=2, max_length=80)
    customer_phone: str
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    start_time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")

    @field_validator("customer_phone")
    @classmethod
    def _phone(cls, v):
        return _norm_phone(v)


class ApproveIn(BaseModel):
    approve: bool
    note: Optional[str] = None
