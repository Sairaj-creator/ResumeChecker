from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    analyses = relationship("ResumeAnalysis", back_populates="owner")


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    raw_text = Column(Text, nullable=False)
    ats_score = Column(Integer)
    missing_skills = Column(JSON)
    feedback_data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="analyses")
    rewrites = relationship("ResumeRewrite", back_populates="analysis")


class ResumeRewrite(Base):
    __tablename__ = "resume_rewrites"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("resume_analyses.id"), nullable=True)
    target_style = Column(String, nullable=False)
    html_content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    analysis = relationship("ResumeAnalysis", back_populates="rewrites")
