import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";

// ResearchPage – server-side upload version
// - Uploads *_voc.pdf / *_voc.txt directly to backend (/api/voc)
// - Shows quick summary for .txt and lets user send to Board
export default function ResearchPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [mode, setMode] = useState<"qa" | "upload">("qa");
  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [summary, setSummary] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  // Prevent browser from opening dropped files
  useEffect(() => {
    const prevent = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  const ask = useCallback(async () => {
    const q = question.trim();
    if (!q) return;
    setLoading(true);
    try {
      const { data } = await api.post("/research", { question: q });
      setAnswer(String(data?.answer ?? ""));
    } finally {
      setLoading(false);
    }
  }, [question]);

  const onKeyDownAsk = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void ask();
    }
  }, [ask]);

  const onFilePicked = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    const valid = lower.includes("_voc") && (lower.endsWith(".pdf") || lower.endsWith(".txt"));
    if (!valid) {
      alert("파일명에 '_voc' 포함 및 .pdf/.txt 확장자만 허용됩니다.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    setUploadedFileUrl("");
    setSummary("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/voc", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const url = String(data?.fileUrl || "");
      if (!url) throw new Error("fileUrl missing in response");

      setUploadedFileUrl(url);

      if (lower.endsWith(".txt")) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(Boolean).slice(0, 5);
        setSummary(lines.join("\n"));
      }
    } catch (err) {
      console.error(err);
      alert("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      e.target.value = ""; // reset file input
    }
  }, []);

  const sendToBoard = useCallback(async () => {
    if (!uploadedFileUrl) return;
    setLoading(true);
    try {
      const res = await api.post("/issues", { question: summary });
      if (res.statusText === "OK") {
        alert("이슈 공유가 완료되었습니다.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("보드로 보내기 실패했습니다.");
    }
  }, [navigate, summary, uploadedFileUrl]);

  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <h2 className="text-2xl font-bold">Research QA</h2>

      {/* 모드 토글 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("qa")}
          className={`px-3 py-1 rounded-md text-sm ${mode === "qa" ? "bg-indigo-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          UX 검색
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`px-3 py-1 rounded-md text-sm ${mode === "upload" ? "bg-indigo-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          VOC 업로드
        </button>
      </div>

      {/* 질문 입력 */}
      {mode === "qa" && (<div className="flex rounded-md border border-gray-300 p-2 shadow-sm">
        <input
          className="flex-grow px-4 py-2 rounded-l-md border border-r-0 border-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="UX Research 궁금한 것들 물어보세요"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKeyDownAsk}
        />
        <button
          onClick={ask}
          disabled={loading}
          className="px-6 py-2 rounded-r-md bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </div>)}

      {/* 파일 업로드 (버튼 + 숨김 input) */}
      {mode === "upload" && (
      <div className="mt-2">
        <button
          type="button"
          onClick={() => { setMode("upload"); fileInputRef.current?.click(); }}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-white font-semibold shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "업로드 중…" : "VOC 파일 업로드"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          onChange={onFilePicked}
          className="hidden"
          aria-label="Upload VOC file (.pdf or .txt)"
        />

        {/* 요약 및 보드로 보내기 */}
        {uploadedFileUrl && (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl bg-white ring-1 ring-gray-200 p-4">
              <div className="text-sm text-gray-500 break-all">{uploadedFileUrl}</div>
              <label className="block font-semibold mt-3">요약 (필요 시 수정):</label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 resize-y"
                rows={5}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder={".txt는 상단 일부가 자동 채워집니다. PDF는 직접 요약해주세요."}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setUploadedFileUrl(""); setSummary(""); }}
                className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                취소
              </button>
              <button
                type="button"
                onClick={sendToBoard}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이슈 공유
              </button>
            </div>
          </div>
        )}
      </div>)}

      {/* 답변 */}
      {mode === "qa" && answer && (
        <article className="prose whitespace-pre-wrap">{answer}</article>
      )}
    </section>
  );
}