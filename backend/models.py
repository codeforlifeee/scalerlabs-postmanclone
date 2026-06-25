from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    requests = relationship("SavedRequest", back_populates="collection", cascade="all, delete-orphan")

class SavedRequest(Base):
    __tablename__ = "saved_requests"

    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collections.id"))
    name = Column(String)
    method = Column(String)
    url = Column(String)
    headers = Column(JSON, default=list) # [{key: "", value: "", is_active: True}]
    query_params = Column(JSON, default=list)
    body_type = Column(String, default="none") # none, raw, form-data, urlencoded
    body_content = Column(Text, nullable=True)
    auth_type = Column(String, default="none") # none, bearer, basic
    auth_config = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    collection = relationship("Collection", back_populates="requests")

class Environment(Base):
    __tablename__ = "environments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    variables = relationship("EnvironmentVariable", back_populates="environment", cascade="all, delete-orphan")

class EnvironmentVariable(Base):
    __tablename__ = "environment_variables"

    id = Column(Integer, primary_key=True, index=True)
    environment_id = Column(Integer, ForeignKey("environments.id"))
    key = Column(String)
    value = Column(String)
    is_active = Column(Boolean, default=True)

    environment = relationship("Environment", back_populates="variables")

class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    method = Column(String)
    url = Column(String)
    headers = Column(JSON, default=list)
    query_params = Column(JSON, default=list)
    body = Column(Text, nullable=True)
    status_code = Column(Integer, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    response_size_bytes = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
