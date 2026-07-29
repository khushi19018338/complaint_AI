import os
import datetime
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Locate database in the backend directory
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "complaints.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String(50), unique=True, index=True)
    complaint_source = Column(String(100))
    customer_name = Column(String(200))
    product_name = Column(String(200))
    product_strength = Column(String(100))
    batch_number = Column(String(100))
    manufacturing_date = Column(String(100))
    expiry_date = Column(String(100))
    quantity_affected = Column(String(100))
    complaint_type = Column(String(200))
    complaint_date = Column(String(100))
    detailed_description = Column(Text)
    initial_severity = Column(String(100))
    priority = Column(String(100))
    risk_assessment_justification = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

def save_complaint_db(form_state: dict) -> str:
    db = SessionLocal()
    try:
        # Generate complaint ID
        timestamp = int(datetime.datetime.utcnow().timestamp())
        comp_id = f"CMP-{timestamp % 100000}"

        db_complaint = Complaint(
            complaint_id=comp_id,
            complaint_source=form_state.get("complaintSource"),
            customer_name=form_state.get("customerName"),
            product_name=form_state.get("productName"),
            product_strength=form_state.get("productStrength"),
            batch_number=form_state.get("batchNumber"),
            manufacturing_date=form_state.get("manufacturingDate"),
            expiry_date=form_state.get("expiryDate"),
            quantity_affected=form_state.get("quantityAffected"),
            complaint_type=form_state.get("complaintType"),
            complaint_date=form_state.get("complaintDate"),
            detailed_description=form_state.get("detailedDescription"),
            initial_severity=form_state.get("initialSeverity"),
            priority=form_state.get("priority"),
            risk_assessment_justification=form_state.get("riskJustification")
        )
        db.add(db_complaint)
        db.commit()
        db.refresh(db_complaint)
        return comp_id
    finally:
        db.close()
