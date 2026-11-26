import os

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.agents.investigation_graph import investigation_graph

from backend.database.incident_repository import (
    save_incident,
    get_all_incidents,
    get_incident_by_id
)

from backend.auth.auth_routes import (
    router as auth_router,
    get_current_user
)


app = FastAPI(
    title="SentinelAI",
    description="AI-Powered Production Incident Investigation System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth_router)


class IncidentRequest(BaseModel):
    logs: str = Field(min_length=1)


@app.get("/")
def home():
    return {
        "message": "Welcome to SentinelAI",
        "status": "Backend is running"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/analyze")
def analyze(
    request: IncidentRequest,
    current_user=Depends(get_current_user)
):
    result = investigation_graph.invoke({
        "logs": request.logs
    })

    incident_id = save_incident(
        logs=request.logs,
        log_analysis=result["log_analysis"],
        root_cause=result["root_cause"],
        solution=result["solution"],
        user_id=current_user["id"],
        rag_sources=result.get("rag_sources", [])
    )

    return {
        "incident_id": incident_id,
        "logs": request.logs,
        "log_analysis": result["log_analysis"],
        "root_cause": result["root_cause"],
        "solution": result["solution"],
        "rag_sources": result.get("rag_sources", [])
    }


@app.get("/incidents")
def list_incidents(
    current_user=Depends(get_current_user)
):
    incidents = get_all_incidents(current_user["id"])

    return {
        "total": len(incidents),
        "incidents": incidents
    }


@app.get("/incidents/{incident_id}")
def get_incident(
    incident_id: int,
    current_user=Depends(get_current_user)
):
    incident = get_incident_by_id(
        incident_id,
        current_user["id"]
    )

    if incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    return incident
