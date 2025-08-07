import os, json
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.chains.template_chain import get_template_chain

router = APIRouter()

load_dotenv()


class TemplateIn(BaseModel):
    business_desc: str
    funnel_stage: str
    tone: str
    insight: str


@router.post("", response_model=List[Dict[str, Any]])
async def generate_templates(payload: TemplateIn):
    try:
        # LCEL pipeline → 바로 list[dict] 반환
        result = get_template_chain().invoke(payload.model_dump())
    except Exception as e:
        raise HTTPException(500, f"LLM Error: {e}")
    return result
