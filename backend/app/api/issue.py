# app/api/issue.py
import os, json
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.chains.issue_chain import get_issue_chain
from app.chains.research_chain import answer_question
from app.services.notify import post_slack
from starlette.concurrency import run_in_threadpool

router = APIRouter()


class IssueIn(BaseModel):
    question: str
    content: Optional[str] = None  # backward compatibility; ignored
    use_tools: bool = False  # default: do NOT use tools like pdf_search


@router.post("", summary="Insight ▶ Issue")
async def create_issue(payload: IssueIn, request: Request):
    try:
        # ① QA 생성 (옵션)
        #    - use_tools=True 인 경우에만 research 에이전트(도구) 사용
        #    - 실패 시/끄면, 질문 자체를 요약 텍스트로 사용 (도구 미사용 경로)
        try:
            if getattr(payload, "use_tools", False):
                qa = await answer_question({"question": payload.question})
            else:
                qa = payload.question  # 도구 미사용: 질문을 요약 텍스트로 간주
        except Exception as _:
            qa = payload.question  # 툴 실패시 안전한 폴백
        print("🔍 QA content:", qa)

        # ② Issue JSON 파싱 (이미 dict)
        raw_issue = await run_in_threadpool(get_issue_chain().invoke, {"answer": qa})

        if isinstance(raw_issue, (dict, list)):
            issue = raw_issue
        elif isinstance(raw_issue, str):
            try:
                issue = json.loads(raw_issue)
            except json.JSONDecodeError as e:
                raise ValueError(
                    f"Failed to parse issue string as JSON: {raw_issue}"
                ) from e
        elif hasattr(raw_issue, "content") and isinstance(
            getattr(raw_issue, "content", None), str
        ):
            try:
                issue = json.loads(getattr(raw_issue, "content", None))
            except json.JSONDecodeError as e:
                raise ValueError(
                    f"Failed to parse issue content as JSON: {getattr(raw_issue, 'content', None)}"
                ) from e
        else:
            raise ValueError(f"Unexpected issue type: {type(raw_issue)}")

        # 3) 슬랙 공유
        await post_slack(issue)  # issue 는 dict

        return issue
    except Exception as e:
        raise HTTPException(500, f"Issue Error: {e}")
