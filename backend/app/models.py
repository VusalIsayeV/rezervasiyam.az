from datetime import datetime
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(20), default="owner")  # owner | mentor
    voen: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    business: Mapped["Business | None"] = relationship(back_populates="owner", uselist=False)


class Business(Base):
    __tablename__ = "businesses"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(120))
    voen: Mapped[str | None] = mapped_column(String(20), nullable=True)
    category_slug: Mapped[str] = mapped_column(String(50))
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    about: Mapped[str] = mapped_column(Text)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    address: Mapped[str] = mapped_column(String(255))
    contact_email: Mapped[str] = mapped_column(String(120))
    contact_phone: Mapped[str] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|approved|rejected
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    services: Mapped[list] = mapped_column(JSON, default=list)
    images: Mapped[list] = mapped_column(JSON, default=list)
    working_hours: Mapped[list] = mapped_column(JSON, default=list)
    closed_days: Mapped[list] = mapped_column(JSON, default=list)
    discounts: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped["User"] = relationship(back_populates="business")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="business", cascade="all, delete-orphan")


class Booking(Base):
    __tablename__ = "bookings"
    id: Mapped[int] = mapped_column(primary_key=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"), index=True)
    service_name: Mapped[str] = mapped_column(String(120))
    customer_name: Mapped[str] = mapped_column(String(120))
    customer_phone: Mapped[str] = mapped_column(String(30))
    date: Mapped[str] = mapped_column(String(10), index=True)  # YYYY-MM-DD
    start_time: Mapped[str] = mapped_column(String(5))  # HH:MM
    duration_min: Mapped[int] = mapped_column(Integer)
    price: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="confirmed")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    business: Mapped["Business"] = relationship(back_populates="bookings")
