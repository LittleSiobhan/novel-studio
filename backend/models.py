"""
数据库模型 - 项目存储
"""
import os
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://novelstudio:NovelStudio2026@localhost:5432/novelstudio")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    novel_text = Column(Text, nullable=True)
    ad_data = Column(JSON, nullable=True)
    script = Column(Text, nullable=True)
    storyboards = Column(JSON, nullable=True)
    characters = Column(JSON, nullable=True)
    scenes = Column(JSON, nullable=True)
    props = Column(JSON, nullable=True)
    reference_images = Column(JSON, nullable=True)  # [{url, tag, name, created_at}]
    settings = Column(JSON, nullable=True)
    status = Column(String(50), default="draft")
    workspace_type = Column(String(20), default="ad")  # novel | ad
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
