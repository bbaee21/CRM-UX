// frontend/src/pages/Home.tsx
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-white to-slate-50">
      {/* HERO */}
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-10 text-center">
        <p className="text-sm tracking-wider text-slate-500 font-medium">CRM • UX • FRONTEND</p>
        <h1 className="mt-3 text-5xl font-extrabold tracking-tight text-slate-900">CRM UX</h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600">
          퍼널 단계별 메시지 템플릿, UX 리서치, 이슈 보드를 한 곳에서.  
          개발 전에 방향을 정리하고, 개발 이후엔 빠르게 개선하세요.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/templates"
            className="rounded-lg bg-blue-600 text-white px-5 py-3 font-medium hover:bg-blue-700 transition"
          >
            Message Template
          </Link>
          <Link
            to="/research"
            className="rounded-lg bg-slate-900 text-white px-5 py-3 font-medium hover:bg-black transition"
          >
            UX Research
          </Link>
          <Link
            to="/board"
            className="rounded-lg bg-white text-slate-900 ring-1 ring-slate-200 px-5 py-3 font-medium hover:bg-slate-50 transition"
          >
            Issue Board
          </Link>
        </div>

        {/* quick search bar */}
        {/* <div className="mt-8 flex w-full justify-center">
          <div className="flex w-full max-w-xl items-center gap-2 rounded-xl ring-1 ring-slate-200 bg-white px-3 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"/>
            </svg>
            <input
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
              placeholder="무엇을 찾고 있나요? 예: 온보딩 이탈, 버튼 시인성, 장바구니 UX"
            />
            <button className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition">
              검색
            </button>
          </div>
        </div> */}
      </section>

      {/* FEATURES */}
      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 pb-16 sm:grid-cols-3">
        <Feature
          title="퍼널 템플릿"
          desc="가입/활성/구매/재구매 단계별 메시지 샘플과 톤&매체 가이드를 제공합니다."
          to="/templates"
        />
        <Feature
          title="리서치 스니펫"
          desc="최근 UX 인사이트와 문서 요약을 모아 빠르게 의사결정하세요."
          to="/research"
        />
        <Feature
          title="이슈 트래킹"
          desc="발견된 이슈를 역할별 태스크로 나눠 우선순위를 관리합니다."
          to="/board"
        />
      </section>

      {/* FOOTER MINI */}
      <footer className="mx-auto max-w-5xl px-6 pb-10 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} CRM-UX. Build fast. Iterate faster.
      </footer>
    </div>
  );
}

function Feature({ title, desc, to }: { title: string; desc: string; to: string }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl ring-1 ring-slate-200 bg-white p-5 hover:shadow-lg hover:ring-slate-300 transition"
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 rounded-lg bg-blue-50 p-2 text-blue-600 ring-1 ring-blue-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 4h16v4H4zM4 10h10v4H4zM4 16h16v4H4z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{desc}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600">
            이동하기
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="m13.5 5 7 7-7 7-1.5-1.5 4.5-4.5H3v-2h13.5L12 6.5z" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}