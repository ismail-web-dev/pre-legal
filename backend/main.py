import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.documents import router as documents_router

app = FastAPI(
    title="Pre-Legal Document Generator API",
    description="Backend API for creating pre-legal document drafts.",
    version="0.2.0",
)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://pre-legal.vercel.app",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    # Support comma-separated URLs or single URL
    for url in frontend_url.split(","):
        cleaned_url = url.strip()
        if cleaned_url and cleaned_url not in origins:
            origins.append(cleaned_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Pre-Legal Document Generator API"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
