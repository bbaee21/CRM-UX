# app/api/issue.py
import os, json
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.chains.issue_chain import get_issue_chain
from app.chains.research_chain import answer_question
from app.services.notify import post_slack

router = APIRouter()


class IssueIn(BaseModel):
    question: str


@router.post("", summary="Insight ▶ Issue")
async def create_issue(payload: IssueIn, request: Request):
    try:
        # ① 기존 QA 호출
        qa = await answer_question({"question": payload.question})
        print("🔍 QA content:", qa)

        # 2) Issue JSON 파싱 (이미 dict)
        issue: dict = await get_issue_chain().ainvoke({"answer": qa})
        # 3) 슬랙 공유
        await post_slack(issue)  # issue 는 dict

        return issue
    except Exception as e:
        raise HTTPException(500, f"Issue Error: {e}")
