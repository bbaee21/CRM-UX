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


# 수동 CORS 헤더 추가 (미들웨어와 함께)
@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response


app.include_router(templates.router, prefix="/api/templates", tags=["templates"])
app.include_router(research.router, prefix="/api/research", tags=["research"])
app.include_router(issue.router, prefix="/api/issues")
