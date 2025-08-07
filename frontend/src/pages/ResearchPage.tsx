import { useState } from "react";
import { api } from "../api";

/**
 * ResearchPage
 * -------------
 * 1. 사용자 질문 → /api/research 호출
 * 2. LLM 답변을 받아 화면에 표시
 */
export default function ResearchPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/research", { question });
      setAnswer(data.answer);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="p-6 max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Templates·Research QA</h2>

      {/* 질문 입력 */}
      <div className="flex gap-2">
        <input
          className="flex-1 border p-2 rounded"
          placeholder="Ask a research question…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          onClick={ask}
          disabled={loading}
          className="border px-4 py-2 rounded bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </div>

      {/* 답변 */}
      {answer && (
        <article className="prose whitespace-pre-wrap">{answer}</article>
      )}
    </section>
  );
}