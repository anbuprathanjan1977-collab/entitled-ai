from datetime import date, datetime
from typing import List, Optional
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, DateTime, 
    ForeignKey, Table, Text, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

scheme_documents = Table(
    "scheme_documents",
    Base.metadata,
    Column("scheme_id", Integer, ForeignKey("schemes.id", ondelete="CASCADE"), primary_key=True),
    Column("document_id", Integer, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True),
)

class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name_en = Column(String(255), nullable=False)
    name_ta = Column(String(255), nullable=False)
    name_hi = Column(String(255), nullable=True)
    level = Column(String(50), nullable=False, default="state")  # central / state
    state = Column(String(100), nullable=False, default="Tamil Nadu")
    category = Column(String(100), nullable=False, default="Education")
    benefit_amount = Column(Float, nullable=False, default=0.0)
    benefit_text = Column(String(255), nullable=False)
    description_en = Column(Text, nullable=False)
    description_ta = Column(Text, nullable=False)
    description_hi = Column(Text, nullable=True)
    deadline = Column(Date, nullable=True)
    official_url = Column(String(500), nullable=False)
    apply_steps = Column(JSON, nullable=False, default=list)  # list of strings or dicts
    rules = Column(JSON, nullable=False, default=list)  # list of rule dicts
    last_verified = Column(Date, nullable=False, default=date.today)
    active = Column(Boolean, nullable=False, default=True)

    # Relationships
    documents = relationship("Document", secondary=scheme_documents, back_populates="schemes")
    source = relationship("SchemeSource", back_populates="scheme", uselist=False, cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="scheme", cascade="all, delete-orphan")
    change_events = relationship("ChangeEvent", back_populates="scheme", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name_en = Column(String(255), nullable=False)
    name_ta = Column(String(255), nullable=False)
    name_hi = Column(String(255), nullable=True)
    how_to_get_en = Column(Text, nullable=False)
    how_to_get_ta = Column(Text, nullable=False)
    how_to_get_hi = Column(Text, nullable=True)

    schemes = relationship("Scheme", secondary=scheme_documents, back_populates="documents")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    device_id = Column(String(100), nullable=False, index=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False, default="pending")  # applied / pending / received
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    scheme = relationship("Scheme", back_populates="applications")

class SchemeSource(Base):
    __tablename__ = "scheme_sources"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id", ondelete="CASCADE"), unique=True, nullable=False)
    url = Column(String(500), nullable=False)
    last_hash = Column(String(128), nullable=False, default="")
    last_text = Column(Text, nullable=True)
    last_checked = Column(DateTime, nullable=False, default=datetime.utcnow)

    scheme = relationship("Scheme", back_populates="source")

class ChangeEvent(Base):
    __tablename__ = "change_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    old_text = Column(Text, nullable=False, default="")
    new_text = Column(Text, nullable=False, default="")
    diff = Column(Text, nullable=False, default="")
    ai_summary = Column(Text, nullable=False, default="")
    status = Column(String(50), nullable=False, default="pending")  # pending / approved / rejected
    detected_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    scheme = relationship("Scheme", back_populates="change_events")

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

class GovtExam(Base):
    __tablename__ = "govt_exams"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title_en = Column(String(255), nullable=False)
    title_ta = Column(String(255), nullable=False)
    title_hi = Column(String(255), nullable=True)
    conducting_body = Column(String(100), nullable=False)  # UPSC, TNPSC, SSC, RRB, IBPS, etc.
    post_name = Column(String(255), nullable=False)
    level = Column(String(50), nullable=False, default="central")  # central / state
    state = Column(String(100), nullable=False, default="All India")
    category = Column(String(100), nullable=False, default="Civil Services")
    qualification = Column(String(100), nullable=False, default="Any Degree / Graduate")
    age_limit = Column(String(100), nullable=False, default="21 - 32 years")
    total_vacancies = Column(String(100), nullable=False, default="Various")
    salary_scale = Column(String(100), nullable=True)
    application_fee = Column(String(255), nullable=True)
    start_date = Column(Date, nullable=True)
    deadline = Column(Date, nullable=False)
    exam_date = Column(String(100), nullable=True)
    official_portal_url = Column(String(500), nullable=False)
    notification_pdf_url = Column(String(500), nullable=True)
    selection_process = Column(JSON, nullable=False, default=list)
    description_en = Column(Text, nullable=False)
    description_ta = Column(Text, nullable=True)
    description_hi = Column(Text, nullable=True)
    active = Column(Boolean, nullable=False, default=True)

class UserReminder(Base):
    __tablename__ = "user_reminders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    device_id = Column(String(100), nullable=False, index=True)
    item_type = Column(String(50), nullable=False)  # scheme / exam
    item_id = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    deadline = Column(Date, nullable=False)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

