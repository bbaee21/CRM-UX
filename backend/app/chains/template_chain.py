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


prompt = PromptTemplate(
    input_variables=["business_desc", "funnel_stage", "tone", "insight"],
    template="""
You are a senior Korean CRM copywriter.
Business: {business_desc}
Funnel: {funnel_stage}
Tone: {tone}
Insight: {insight}

Return 3 messages (<80 chars, Korean) with rationale.
JSON ONLY: [{{"copy":"...", "rationale":"..."}}]
""",
)

parser = JsonOutputParser()


def get_template_chain():
    """Template chain for generating CRM messages based on business context."""
    return prompt | llm | parser
