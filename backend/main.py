from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import templates, research, issue, voc

app = FastAPI(title="CRM")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
        "https://wonderful-desert-*.azurestaticapps.net",
        "https://wonderful-desert-01854b51e.2.azurestaticapps.net",
    ],
    allow_credentials=False,  # credentials는 False로 설정
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(templates.router, prefix="/api/templates", tags=["templates"])
app.include_router(research.router, prefix="/api/research", tags=["research"])
app.include_router(issue.router, prefix="/api/issues", tags=["issues"])
app.include_router(voc.router, prefix="/api/voc", tags=["voc"])
