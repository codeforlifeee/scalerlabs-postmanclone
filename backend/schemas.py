from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class RequestBase(BaseModel):
    name: str
    method: str
    url: str
    headers: List[Dict[str, Any]] = []
    query_params: List[Dict[str, Any]] = []
    body_type: str = "none"
    body_content: Optional[str] = None
    auth_type: str = "none"
    auth_config: Dict[str, Any] = {}

class RequestCreate(RequestBase):
    pass

class RequestUpdate(RequestBase):
    pass

class RequestResponse(RequestBase):
    id: int
    collection_id: int
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class CollectionBase(BaseModel):
    name: str
    description: Optional[str] = None

class CollectionCreate(CollectionBase):
    pass

class CollectionUpdate(CollectionBase):
    pass

class CollectionResponse(CollectionBase):
    id: int
    created_at: datetime
    requests: List[RequestResponse] = []

    class Config:
        orm_mode = True
        from_attributes = True

class EnvVarBase(BaseModel):
    key: str
    value: str
    is_active: bool = True

class EnvVarCreate(EnvVarBase):
    pass

class EnvVarResponse(EnvVarBase):
    id: int
    environment_id: int

    class Config:
        orm_mode = True
        from_attributes = True

class EnvironmentBase(BaseModel):
    name: str

class EnvironmentCreate(EnvironmentBase):
    pass

class EnvironmentUpdate(EnvironmentBase):
    pass

class EnvVarUpdate(BaseModel):
    key: Optional[str] = None
    value: Optional[str] = None
    is_active: Optional[bool] = None

class EnvironmentResponse(EnvironmentBase):
    id: int
    created_at: datetime
    variables: List[EnvVarResponse] = []

    class Config:
        orm_mode = True
        from_attributes = True

class ProxyRequest(BaseModel):
    method: str
    url: str
    headers: List[Dict[str, str]] = []
    body_type: str = "none"
    body_content: Optional[str] = None
    auth_type: str = "none"
    auth_config: Dict[str, Any] = {}

class HistoryResponse(BaseModel):
    id: int
    method: str
    url: str
    headers: List[Dict[str, Any]] = []
    query_params: List[Dict[str, Any]] = []
    body: Optional[str] = None
    status_code: Optional[int] = None
    response_time_ms: Optional[int] = None
    response_size_bytes: Optional[int] = None
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
