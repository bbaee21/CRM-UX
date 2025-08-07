from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.chains.research_chain import answer_question

router = APIRouter()


class QuestionIn(BaseModel):
    question: str


@router.post("", tags=["research"])
async def research_qa(payload: QuestionIn):
    try:
        ans = await answer_question(payload.question)
    except Exception as e:
        raise HTTPException(500, f"QA Error: {e}")
    return {"answer": ans}
