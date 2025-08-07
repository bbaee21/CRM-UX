from sqlalchemy import Column, Integer, String, JSON
from app.services.db import Base


class TemplateLog(Base):
    __tablename__ = "template_logs"
    id = Column(Integer, primary_key=True, index=True)
    payload = Column(JSON)
    result = Column(JSON)
