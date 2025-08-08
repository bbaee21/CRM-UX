import os
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langchain.prompts import PromptTemplate
from langchain_core.output_parsers.json import JsonOutputParser


load_dotenv()

# Use a JSON parser and inject its format instructions to the prompt
parser = JsonOutputParser()
format_instructions = parser.get_format_instructions()

# Lightweight few-shot examples to stabilize structure & tone
EXAMPLES = (
    "# Examples (follow this structure strictly)\n"
    "Example 1\n"
    "Answer (context):\n"
    "- 회원가입 중 로딩 지연으로 이탈 발생\n"
    "- 입력 값이 저장되지 않아 사용자 불만 증가\n"
    "- 고객센터 연결 동선이 없음\n"
    "Output JSON:\n"
    "{\n"
    '  "title": "회원가입 중 로딩 지연으로 이탈 증가",\n'
    '  "severity": "High",\n'
    '  "tasks": {\n'
    '    "Dev": ["입력값 자동 임시저장 기능 구현", "TTFB 1s 이하로 성능 최적화", "오류 로그 수집/알림 설정"],\n'
    '    "PM": ["이탈 구간/원인 데이터 분석", "임시저장/복원 정책 수립", "고객센터 연동 우선순위 조정"],\n'
    '    "Design": ["에러/지연 안내 UX 개선", "이어하기 CTA 고정", "고객센터 진입 버튼 추가"]\n'
    "  }\n"
    "}\n\n"
    "Example 2\n"
    "Answer (context):\n"
    "- 장바구니 방치 48시간 이후 재방문율 낮음\n"
    "- 푸시/이메일 리마인드 없음\n"
    "- 배송비에 대한 불확실성 존재\n"
    "Output JSON:\n"
    "{\n"
    '  "title": "장바구니 방치로 전환 저하",\n'
    '  "severity": "Medium",\n'
    '  "tasks": {\n'
    '    "Dev": ["장바구니 보존 기간 7일 설정", "쿠폰 적용 미리보기 구현", "배송비 계산 API 노출"],\n'
    '    "PM": ["방치 24/48h 리마인드 시나리오 설계", "전환률/오픈률 AB 테스트 기획", "비용-효과 분석"],\n'
    '    "Design": ["리마인드 메시지 톤앤매너 정의", "장바구니 이어하기 버튼 강조", "배송비 안내 모듈 시각화"]\n'
    "  }\n"
    "}\n"
)

issue_prompt = PromptTemplate(
    input_variables=["answer"],
    template=r"""
You are a product owner who converts UX insight into a triage-ready issue.
Return ONLY valid JSON (UTF-8, double quotes). No extra text before/after JSON.
Each output must be an object with keys: "title" (string), "severity" (one of High/Medium/Low), "tasks" (object with keys Dev, PM, Design; each an array of 3 concise items).
{format_instructions}

{EXAMPLES}

Answer (context):
{answer}

Output JSON:
""",
    partial_variables={
        "format_instructions": format_instructions,
        "EXAMPLES": EXAMPLES,
    },
)

llm = AzureChatOpenAI(
    azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    temperature=0.7,
    max_tokens=500,
)


def get_issue_chain():
    """Issue chain for processing UX insights into actionable issues."""
    return issue_prompt | llm | parser
