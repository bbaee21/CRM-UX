# CRM-UX



> 퍼널 단계별 CRM 메시지 작성 ✚ 최신 UX 리서치 인사이트 발굴 ✚ Slack 자동 공유를 **하나의 UI**로 묶은 생산성 툴

1. **Message Template** – Acquisition → Retention 단계별 카피를 Azure OpenAI로 자동 생성
2. **UX Research** -
   - PDF 리포트(RAG, Azure Cognitive Search)
   - Web Search(최신 기사·블로그)
   - 둘을 하이브리드로 검색하여 Q &A
3. **Issue Board** – 리서치 결과를 Dev/PM/Design 세 컬럼 Kanban 으로 분배 ▶ Slack Incoming Webhook으로 실시간 공지



------



## **1 Why & What – 목표 정의**



| **영역**                  | **핵심 목표**                                                | **인사이트 근거**                                            |
| ------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **UX Research 모듈**      | · 자사/경쟁사 데이터·정성 인터뷰·설문을 RAG로 통합 → 리서처가 “전략적 인사이트”를 뽑는 시간 단축· 크루가 쉽게 공유·재사용 | **리서처가 조직 전략 파트너로 확장**되고 있음                |
| **Message Template 모듈** | · 퍼널(획득→활성→리텐션→윈백)·톤·캠페인 목표 입력 → Azure OpenAI가 실시간 카피 제안· 실 A/B 통계 피드백으로 카피 고도화 | **데이터·인터뷰를 양방향 루프**로 돌려 고객 목소리를 제품·카피에 바로 반영 |

------



## 2 기술 아키텍처 



```
┌──────────────────┐
│  React+TS (Vite) │ ① UX조사·캠페인 입력
└────────┬─────────┘
         │ REST/SignalR
┌────────▼──────────┐
│ FastAPI (Python)  │ ② 인증·비즈로직
│  - LangChain      │ ③ LLM Flow
└────────┬──────────┘
         │
┌────────▼──────────┐           ┌────────────┐
│ Azure OpenAI      │◀ Embedding│ Azure Search│ ④ RAG
└────────┬──────────┘           └────────────┘
         │
┌────────▼──────────┐
│ Blob   │ 						⑤ 리서치 원본·결과
└───────────────────┘
```



- **LLM Flow**  LangChain Graph 노드

  1. ResearchQAChain: 질문+메타데이터 → RAG 답변
  2. TemplateGenChain: 퍼널·톤·컨텍스트 → 카피 제안
  3. ABEvalChain: 실적 JSON → LLM이 개선점 요약

  

------



## 3 폴더/파일 구조



```
crm-ux/
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI 라우터(templates, research, issues)
│   │   ├── chains/         # LangChain 파이프라인
│   │   └── services/       # Blob, Search, Notify 모듈
│   ├── main.py             # FastAPI 엔트리
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/          # TemplatePage, ResearchPage, BoardPage
│   │   ├── components/     # SortableItem, Navbar …
│   │   └── api/            # axios 래퍼
│   └── vite.config.ts
└── README.md               # ← 본 문서
```

| **구분** | **스택**                                                     | **비고**        |
| -------- | ------------------------------------------------------------ | --------------- |
| Backend  | **FastAPI**, LangChain, Azure OpenAI, Azure AI Search, Azure Blob Storage | Python 3.11     |
| Frontend | **React (Vite+TS)**, Tailwind, dnd-kit                       | 정적 SPA        |
| Infra    | Azure App Service(Web App), Azure Static Web Apps, Azure Storage Account | B 스탠더드 플랜 |
| 통합     | Slack Incoming Webhook                                       | 알림            |



------



## 4 로컬실행

```
# ① 클론
git clone https://github.com/your-org/crm-ux-copilot.git
cd crm-ux-copilot

# ② 백엔드 ───────────────────────────────────
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# .env  작성
cp .env.example .env   # KEY, ENDPOINT, SEARCH_NAME …

uvicorn app.main:app --reload     # http://localhost:8000

# ③ 프론트엔드 ────────────────────────────────
cd ../frontend
pnpm install      # or npm / yarn
pnpm dev          # http://localhost:5173
```



## 5 주요 API

| **Method** | **Endpoint**   | **기능**                                    |
| ---------- | -------------- | ------------------------------------------- |
| POST       | /api/templates | 퍼널·톤·인사이트 → 메시지 10개 JSON 반환    |
| POST       | /api/research  | 질문 → UX 리서치 답변 문자열                |
| POST       | /api/issues    | 질문 → Dev/PM/Design Task JSON + Slack 전송 |



## 6 UX Research 운영 프로세스

1. **가설 설정**

   – PM·디자이너·리서처 킥오프 → 문제 정의 & KPI

2. **데이터 수집**

   – 인앱 설문·로그·인터뷰 전사.

   – 결과는 **PostgreSql**에 JSON 스키마로 저장, Azure Search 인덱싱.

3. **RAG 분석**

   – ResearchQAChain으로 “고객이 OOO를 망설이는 주된 이유?” 질의.

4. **인사이트 공유**

   – 주간 Slack Digest + 제품 워크숍.

   – 오픈서베이·토스·배민처럼 **리서처가 전략 의사결정에 직접 참여**.

5. **캠페인 실행 & 학습 루프**

   – 메시지 템플릿 → 실험 → 성과 JSON → ABEevalChain이 개선안 제시 → 다시 캠페인.



------



## **7 추가 스택 & 확장 아이디어**

| **기능**             | **Azure 서비스**                   |
| -------------------- | ---------------------------------- |
| 실시간 사용자 세분화 | Azure Stream Analytics + Event Hub |
| 푸시·SMS 발송        | Azure Communication Services       |
| 카피 자동 번역       | Translator API                     |
| 개인화 추천          | Azure AI Personalizer              |



- **전략적 UX 리서치**로 문제 정의 → **LLM 카피 생성**으로 빠른 실행 → **데이터 루프**로 지속 개선.
  1. **사용자 로그인 & 이력 DB(PostgreSQL)**
  2. 템플릿 A/B 테스트 결과 자동 학습 Loop
  3. AI search + PDF 인덱싱을 Azure AI Studio Vector Index로 전환
  4. 슬랙 메시지 ↔ 보드 Drag Sync(양방향)

## 

