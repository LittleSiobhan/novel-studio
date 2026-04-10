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
    novel_text = Column(Text, nullable=True)       # 原始小说文本
    script = Column(Text, nullable=True)          # 生成的剧本
    storyboards = Column(JSON, nullable=True)     # 分镜列表（JSON）
    settings = Column(JSON, nullable=True)         # 其他配置
    status = Column(String(50), default="draft")  # draft / script_done / storyboard_done
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def init_db():
    """初始化数据库表"""
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
