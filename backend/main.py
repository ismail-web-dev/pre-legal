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
    # Add production frontend URL here when deploying
]

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
