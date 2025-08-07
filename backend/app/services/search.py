import os, requests, datetime as dt, httpx
from langchain.schema import Document
from langchain_community.retrievers.azure_ai_search import AzureAISearchRetriever
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient

# Azure Search retriever for PDFs
pdf_retriever = AzureAISearchRetriever(
    service_name=os.getenv("AZURE_SEARCH_NAME"),
    index_name="rag-cust",
    api_key=os.getenv("AZURE_SEARCH_KEY"),
)


def news_search(query: str, k: int = 5):
    key = os.getenv("NEWSAPI_KEY")
    if not key:
        return []  # 키 없으면 빈 리스트 반환
    url = "https://newsapi.org/v2/everything"
    params = {"q": query, "sortBy": "publishedAt", "pageSize": k, "language": "en"}
    headers = {"X-Api-Key": key}
    resp = httpx.get(url, params=params, headers=headers, timeout=10)
    resp.raise_for_status()
    articles = resp.json().get("articles", [])
    return [
        Document(page_content=a["title"] + " – " + (a.get("description") or ""))
        for a in articles
    ]
