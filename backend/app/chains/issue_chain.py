import os
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langchain.prompts import PromptTemplate
from langchain_core.output_parsers.json import JsonOutputParser

load_dotenv()

issue_prompt = PromptTemplate(
    input_variables=["answer"],
    template=r"""
너는 프로덕트 오너다. 아래 UX 인사이트를 읽고:

1. 인사이트를 1줄로 요약(title)
2. 심각도: Low / Medium / High
3. 역할: Dev, PM, Design
4. 각 담당자 할 일 3개씩 작성

JSON 형식:
{{
  "title": "...",
  "severity": "...",
  "tasks": {{
    "Dev": [],
    "PM": [],
    "Design": []
  }}
}}

Answer:
{answer}
""",
)

llm = AzureChatOpenAI(
    azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    temperature=0.7,
    max_tokens=500,
)

parser = JsonOutputParser()


def get_issue_chain():
    """Issue chain for processing UX insights into actionable issues."""
    return issue_prompt | llm | parser
