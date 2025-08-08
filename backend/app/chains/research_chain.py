import os, datetime as dt, asyncio
from datetime import timezone
from typing import List
from typing import Optional

from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.tools import tool
from langchain_core.prompts import MessagesPlaceholder
from langchain.agents import create_tool_calling_agent, AgentExecutor

from langchain.schema import Document
from langchain_community.retrievers.azure_ai_search import AzureAISearchRetriever
from langchain_tavily import TavilySearch

from azure.storage.blob import BlobProperties
from app.services.blob import BlobService

load_dotenv()


# ─────────────────────────── helpers ──────────────────────────────────────────
def wrap_doc(item) -> Document:
    """Ensure every element is a Document."""
    if isinstance(item, Document):
        return item
    if isinstance(item, dict):
        txt = (
            item.get("page_content")
            or item.get("content")
            or item.get("chunk")
            or item.get("text")
            or ""
        )
        return Document(page_content=txt, metadata=item)
    if isinstance(item, str):
        return Document(page_content=item)
    raise ValueError("Unsupported doc type")


def format_docs(docs: List[Document]) -> str:
    return "\n\n".join(d.page_content for d in docs if d.page_content)


# ─────────────────────────── Tools ────────────────────────────────────────────

_blob = BlobService()

search_retriever = AzureAISearchRetriever(
    service_name=os.getenv("AZURE_SEARCH_NAME"),
    index_name=os.getenv("AZURE_SEARCH_INDEX"),
    api_key=os.getenv("AZURE_SEARCH_KEY"),
    top_k=5,
    content_key="chunk",
)

# Azure Search retriever for PDFs
pdf_retriever = AzureAISearchRetriever(
    service_name=os.getenv("AZURE_SEARCH_NAME"),
    index_name=os.getenv("AZURE_SEARCH_INDEX"),
    api_key=os.getenv("AZURE_SEARCH_KEY"),
)


def latest_pdf_sync() -> Optional[BlobProperties]:
    """Synchronously fetch the latest PDF using the async BlobService helper."""
    try:
        return asyncio.run(_blob.latest_pdf())
    except RuntimeError:
        # Already inside an event loop (FastAPI / agent). Use create_task + gather.
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(_blob.latest_pdf())


@tool
def pdf_search(query: str) -> str:
    """Search PDFs & Azure Search for UX research answers."""
    latest = latest_pdf_sync()
    pdf_age = (
        (dt.datetime.now(timezone.utc) - latest.last_modified).days if latest else 999
    )

    docs = [wrap_doc(d) for d in (pdf_retriever.invoke(query) or [])]

    if (not docs) or pdf_age > 7:
        docs += [wrap_doc(d) for d in (search_retriever.invoke(query) or [])]

    if not docs:
        return "관련 문서를 찾을 수 없습니다."

    llm = AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_KEY"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        temperature=0.3,
        max_tokens=400,
    )

    # Few-shot examples injected into the prompt (structure-preserving)
    examples_text = (
        "# Examples\n"
        "Example 1\n"
        "Context:\n"
        "- 장바구니 이탈율이 62%로 높음\n"
        "- 모바일에서 결제 페이지 로딩이 3.2s → 전환율 저하\n"
        "Question: 장바구니 이탈을 낮추려면?\n"
        "Answer (Korean):\n"
        "• 로딩 원인(이미지/스크립트)을 줄이고 결제 페이지 TTFB 목표 1s 이하로 개선\n"
        "• 장바구니 보존 기간을 7일로 늘리고, 이어하기 CTA를 상단 고정\n"
        "• 실패한 결제 재시도 유도 배너 및 고객센터 진입 동선 추가\n\n"
        "Example 2\n"
        "Context:\n"
        "- 신규 유입은 많으나 온보딩 튜토리얼 이탈률 45%\n"
        "- 튜토리얼 길이 12단계, 핵심 가치 제시가 늦음\n"
        "Question: 온보딩 완주율을 올리려면?\n"
        "Answer (Korean):\n"
        "• 3~5단계로 축소하고 첫 10초 내 핵심 가치(혜택)를 먼저 제시\n"
        "• 단계별 진행률/보상 표시, 건너뛰기 후 재진입 경로 제공\n"
        "• 마이크로 카피로 사용자의 다음 행동을 구체적으로 안내\n"
    )

    prompt = ChatPromptTemplate.from_template(
        "You are a senior UX researcher. Use ONLY the context.\n\n"
        "{examples}\n\n"
        "Context:\n{context}\n\n"
        "Question: {question}\n"
        "Answer in Korean as 3-5 concise bullet points using only facts from Context. "
        "If information is missing, reply: '문서에서 답을 찾을 수 없습니다.'"
    ).partial(examples=examples_text)

    chain = (
        {
            "context": lambda q: format_docs(docs),
            "question": RunnablePassthrough(),
        }
        | prompt
        | llm
        | StrOutputParser()
    )
    return chain.invoke(query)


@tool
def web_search(query: str) -> str:
    """Search the public web via Tavily (returns top-k snippets)."""
    tav = TavilySearch(k=3, search_depth="basic")

    raw = tav.invoke(query)  # dict
    results = raw.get("results", [])  # 실제 문서 리스트 추출

    # 결과가 dict(list) → Document 변환
    snippets = [
        f"{item['title']} – {item['content']}"
        for item in results
        if isinstance(item, dict)
    ]
    return "\n\n".join(snippets) if snippets else "No web result."


# ───────────────────────── Agent setup ────────────────────────────────────────
TOOLS = [pdf_search, web_search]

base_llm = AzureChatOpenAI(
    azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    temperature=0,
    max_tokens=512,
)

agent_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "당신은 CRM 전문가이자 UX 리서처입니다. "
            "고객 퍼널별 UX 인사이트, CRM 메시지 템플릿과 관련된 질문은 pdf_search 도구를 우선 사용하고, "
            "최신 일반 정보가 필요하면 web_search 도구를 사용하세요.",
        ),
        ("user", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ]
)

AGENT = create_tool_calling_agent(base_llm, TOOLS, agent_prompt)
EXECUTOR = AgentExecutor(agent=AGENT, tools=TOOLS, verbose=True)


# ───────────────────────── Public entry ───────────────────────────────────────
async def answer_question(question: str) -> str:
    """Async entry for FastAPI."""
    result = await EXECUTOR.ainvoke({"input": question})
    return result["output"]
