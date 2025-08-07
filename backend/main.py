from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import templates, research, issue

app = FastAPI(title="CRM")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # credentials는 False로 설정
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(templates.router, prefix="/api/templates", tags=["templates"])
app.include_router(research.router, prefix="/api/research", tags=["research"])
app.include_router(issue.router, prefix="/api/issues")
