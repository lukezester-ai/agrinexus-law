"""
AgriNexus Brain — минимален FastAPI entrypoint.
Разширявайте с routers/, services/, background tasks.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AgriNexus Brain",
    description="Python backend / AI & heavy workloads for AgriNexus.Law",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3002", "http://localhost:3020", "http://127.0.0.1:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "agrinexus-brain"}


@app.get("/")
def root():
    return {"message": "AgriNexus Brain API — see /docs"}
