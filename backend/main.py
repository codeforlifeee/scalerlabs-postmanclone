import time
import httpx
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Postman Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Collections ---
@app.post("/collections/", response_model=schemas.CollectionResponse)
def create_collection(collection: schemas.CollectionCreate, db: Session = Depends(get_db)):
    db_collection = models.Collection(**collection.dict())
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)
    return db_collection

@app.get("/collections/", response_model=List[schemas.CollectionResponse])
def read_collections(db: Session = Depends(get_db)):
    collections = db.query(models.Collection).all()
    return collections

@app.delete("/collections/{collection_id}")
def delete_collection(collection_id: int, db: Session = Depends(get_db)):
    db_collection = db.query(models.Collection).filter(models.Collection.id == collection_id).first()
    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    db.delete(db_collection)
    db.commit()
    return {"ok": True}

@app.put("/collections/{collection_id}", response_model=schemas.CollectionResponse)
def update_collection(collection_id: int, collection: schemas.CollectionUpdate, db: Session = Depends(get_db)):
    db_collection = db.query(models.Collection).filter(models.Collection.id == collection_id).first()
    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    db_collection.name = collection.name
    if collection.description is not None:
        db_collection.description = collection.description
    db.commit()
    db.refresh(db_collection)
    return db_collection

# --- Requests ---
@app.post("/collections/{collection_id}/requests/", response_model=schemas.RequestResponse)
def create_request(collection_id: int, request: schemas.RequestCreate, db: Session = Depends(get_db)):
    db_request = models.SavedRequest(**request.dict(), collection_id=collection_id)
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

@app.put("/requests/{request_id}", response_model=schemas.RequestResponse)
def update_request(request_id: int, request: schemas.RequestUpdate, db: Session = Depends(get_db)):
    db_request = db.query(models.SavedRequest).filter(models.SavedRequest.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found")
    for var, value in request.dict().items():
        setattr(db_request, var, value)
    db.commit()
    db.refresh(db_request)
    return db_request

@app.delete("/requests/{request_id}")
def delete_request(request_id: int, db: Session = Depends(get_db)):
    db_request = db.query(models.SavedRequest).filter(models.SavedRequest.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found")
    db.delete(db_request)
    db.commit()
    return {"ok": True}

# --- Environments ---
@app.post("/environments/", response_model=schemas.EnvironmentResponse)
def create_environment(env: schemas.EnvironmentCreate, db: Session = Depends(get_db)):
    db_env = models.Environment(**env.dict())
    db.add(db_env)
    db.commit()
    db.refresh(db_env)
    return db_env

@app.get("/environments/", response_model=List[schemas.EnvironmentResponse])
def read_environments(db: Session = Depends(get_db)):
    return db.query(models.Environment).all()

@app.post("/environments/{env_id}/variables/", response_model=schemas.EnvVarResponse)
def create_env_var(env_id: int, variable: schemas.EnvVarCreate, db: Session = Depends(get_db)):
    db_var = models.EnvironmentVariable(**variable.dict(), environment_id=env_id)
    db.add(db_var)
    db.commit()
    db.refresh(db_var)
    return db_var

@app.put("/environments/{env_id}", response_model=schemas.EnvironmentResponse)
def update_environment(env_id: int, env: schemas.EnvironmentUpdate, db: Session = Depends(get_db)):
    db_env = db.query(models.Environment).filter(models.Environment.id == env_id).first()
    if not db_env:
        raise HTTPException(status_code=404, detail="Environment not found")
    db_env.name = env.name
    db.commit()
    db.refresh(db_env)
    return db_env

@app.delete("/environments/{env_id}")
def delete_environment(env_id: int, db: Session = Depends(get_db)):
    db_env = db.query(models.Environment).filter(models.Environment.id == env_id).first()
    if not db_env:
        raise HTTPException(status_code=404, detail="Environment not found")
    db.delete(db_env)
    db.commit()
    return {"ok": True}

@app.put("/environments/{env_id}/variables/{var_id}", response_model=schemas.EnvVarResponse)
def update_env_var(env_id: int, var_id: int, variable: schemas.EnvVarUpdate, db: Session = Depends(get_db)):
    db_var = db.query(models.EnvironmentVariable).filter(
        models.EnvironmentVariable.id == var_id,
        models.EnvironmentVariable.environment_id == env_id
    ).first()
    if not db_var:
        raise HTTPException(status_code=404, detail="Variable not found")
    if variable.key is not None:
        db_var.key = variable.key
    if variable.value is not None:
        db_var.value = variable.value
    if variable.is_active is not None:
        db_var.is_active = variable.is_active
    db.commit()
    db.refresh(db_var)
    return db_var

@app.delete("/environments/{env_id}/variables/{var_id}")
def delete_env_var(env_id: int, var_id: int, db: Session = Depends(get_db)):
    db_var = db.query(models.EnvironmentVariable).filter(
        models.EnvironmentVariable.id == var_id,
        models.EnvironmentVariable.environment_id == env_id
    ).first()
    if not db_var:
        raise HTTPException(status_code=404, detail="Variable not found")
    db.delete(db_var)
    db.commit()
    return {"ok": True}

# --- History ---
@app.get("/history/", response_model=List[schemas.HistoryResponse])
def read_history(db: Session = Depends(get_db)):
    return db.query(models.History).order_by(models.History.created_at.desc()).all()

@app.delete("/history/")
def clear_history(db: Session = Depends(get_db)):
    db.query(models.History).delete()
    db.commit()
    return {"ok": True}

@app.delete("/history/{history_id}")
def delete_history_entry(history_id: int, db: Session = Depends(get_db)):
    entry = db.query(models.History).filter(models.History.id == history_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    db.delete(entry)
    db.commit()
    return {"ok": True}

# --- Proxy Runner ---
@app.post("/proxy/")
async def proxy_request(proxy_req: schemas.ProxyRequest, db: Session = Depends(get_db)):
    headers = {}
    for h in proxy_req.headers:
        if h.get("key") and h.get("is_active", True):
            headers[h["key"]] = h["value"]
            
    # Handle Auth
    if proxy_req.auth_type == "bearer":
        token = proxy_req.auth_config.get("token", "")
        headers["Authorization"] = f"Bearer {token}"
    elif proxy_req.auth_type == "basic":
        import base64
        username = proxy_req.auth_config.get("username", "")
        password = proxy_req.auth_config.get("password", "")
        auth_str = f"{username}:{password}"
        b64_auth = base64.b64encode(auth_str.encode()).decode()
        headers["Authorization"] = f"Basic {b64_auth}"
        
    start_time = time.time()
    
    # We will use httpx for async request
    async with httpx.AsyncClient() as client:
        try:
            req_kwargs = {
                "method": proxy_req.method,
                "url": proxy_req.url,
                "headers": headers,
            }
            if proxy_req.body_type == "raw" and proxy_req.body_content:
                req_kwargs["content"] = proxy_req.body_content
            # To handle form-data or urlencoded we could expand here if needed
                
            response = await client.request(**req_kwargs)
            
            elapsed_ms = int((time.time() - start_time) * 1000)
            
            # Save history
            history_entry = models.History(
                method=proxy_req.method,
                url=proxy_req.url,
                headers=proxy_req.headers,
                body=proxy_req.body_content,
                status_code=response.status_code,
                response_time_ms=elapsed_ms,
                response_size_bytes=len(response.content)
            )
            db.add(history_entry)
            db.commit()
            
            return {
                "status": response.status_code,
                "time_ms": elapsed_ms,
                "size_bytes": len(response.content),
                "headers": dict(response.headers),
                "body": response.text
            }
            
        except Exception as e:
            elapsed_ms = int((time.time() - start_time) * 1000)
            history_entry = models.History(
                method=proxy_req.method,
                url=proxy_req.url,
                headers=proxy_req.headers,
                body=proxy_req.body_content,
                status_code=0,
                response_time_ms=elapsed_ms,
                response_size_bytes=0
            )
            db.add(history_entry)
            db.commit()
            
            return {
                "error": str(e),
                "time_ms": elapsed_ms
            }

@app.get("/seed")
def seed_database(db: Session = Depends(get_db)):
    # Create sample collection
    coll = models.Collection(name="Sample APIs", description="Test JSON endpoints")
    db.add(coll)
    db.commit()
    db.refresh(coll)
    
    # Create sample requests
    req1 = models.SavedRequest(
        collection_id=coll.id,
        name="Get Posts",
        method="GET",
        url="{{base_url}}/posts",
        headers=[],
        query_params=[],
    )
    req2 = models.SavedRequest(
        collection_id=coll.id,
        name="Create Post",
        method="POST",
        url="{{base_url}}/posts",
        headers=[{"key": "Content-type", "value": "application/json; charset=UTF-8", "is_active": True}],
        body_type="raw",
        body_content='{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}'
    )
    db.add(req1)
    db.add(req2)
    
    # Create sample environment
    env = models.Environment(name="JSONPlaceholder")
    db.add(env)
    db.commit()
    db.refresh(env)
    
    env_var = models.EnvironmentVariable(
        environment_id=env.id,
        key="base_url",
        value="https://jsonplaceholder.typicode.com"
    )
    db.add(env_var)
    db.commit()
    
    return {"message": "Database seeded"}
