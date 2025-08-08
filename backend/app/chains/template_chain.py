import os
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langchain.prompts import PromptTemplate
from langchain_core.output_parsers.json import JsonOutputParser

load_dotenv()

llm = AzureChatOpenAI(
    azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    temperature=0.7,
    max_tokens=500,
)

# --- Parser & format instructions injected into the prompt ---
parser = JsonOutputParser()
format_instructions = parser.get_format_instructions()

# --- Lightweight few-shot examples embedded directly in the template ---
examples = (
    "Examples (format only, follow structure and tone):\n"
    "[\n"
    '  {"copy": "첫 방문을 환영해요! 할인 쿠폰으로 시작해보세요.", "rationale": "신규 환영 + 혜택 강조"},\n'
    '  {"copy": "지금 가입하면 첫 구매 할인 쿠폰이 기다리고 있어요!", "rationale": "즉시 혜택으로 전환 유도"},\n'
    '  {"copy": "새로운 시작, 특별한 할인으로 응원할게요!", "rationale": "긍정 톤의 심리적 설득"}\n'
    "]\n"
)

prompt = PromptTemplate(
    input_variables=["business_desc", "funnel_stage", "tone", "insight"],
    template="""
You are a senior Korean CRM copywriter.

# Output format (strict)
Return ONLY valid JSON (an array with exactly 3 objects). Each object MUST have keys "copy" and "rationale". Use double quotes. No extra text before/after the JSON.
{format_instructions}

# Style constraints
- Korean only
- <80 characters per copy
- Match given funnel stage and tone

# Few-shot
{examples}

# Task
Business: {business_desc}
Funnel: {funnel_stage}
Tone: {tone}
Insight: {insight}
""",
    partial_variables={
        "format_instructions": format_instructions,
        "examples": examples,
    },
)


def get_template_chain():
    """Template chain for generating CRM messages based on business context."""
    return prompt | llm | parser
