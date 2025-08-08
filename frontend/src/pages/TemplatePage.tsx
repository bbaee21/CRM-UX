import { useState } from "react";
import { api } from "../api";

export default function TemplatePage() {
  const [form, setForm] = useState({
    business_desc: "",
    funnel_stage: "Acquisition",
    tone: "Friendly",
    insight: "",
  });

  const funnelList = ["Acquisition", "Activation", "Retention", "Win-back"];
  const toneList = ["Friendly", "Urgent", "Empathetic"];
  const [copies, setCopies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handle = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    try {
      setLoading(true);
      const { data } = await api.post("/templates", form);
      setCopies(data || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-base-200">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        {/* HEADER */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Message Template</h1>
            <p className="mt-1 text-sm text-base-content/60">
              비즈니스 설명, 퍼널 단계, 톤, 인사이트를 입력하면 한국어 카피 3개를 생성합니다.
            </p>
          </div>
          <button onClick={submit} disabled={loading} className="btn btn-primary">
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>

        {/* FORM CARD */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="grid grid-cols-1 gap-6">
              <label className="form-control bg-base-100 p-4 rounded-lg border border-base-300">
                <div className="label"><span className="label-text font-semibold">Business</span></div>
                <input
                  className="input input-bordered w-full h-fit"
                  placeholder="예: 과일 청과물 쇼핑몰"
                  value={form.business_desc}
                  onChange={handle("business_desc")}
                />
              </label>

              <div className="grid grid-cols-2 gap-6">
                <label className="form-control bg-base-100 p-4 rounded-lg border border-base-300">
                  <div className="label"><span className="label-text font-semibold">Funnel</span></div>
                  <select className="select select-bordered" value={form.funnel_stage} onChange={handle("funnel_stage")}>
                    {funnelList.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>

                <label className="form-control bg-base-100 p-4 rounded-lg border border-base-300">
                  <div className="label"><span className="label-text font-semibold">Tone</span></div>
                  <select className="select select-bordered" value={form.tone} onChange={handle("tone")}>
                    {toneList.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="form-control md:col-span-2 bg-base-100 p-4 rounded-lg border border-base-300">
                <div className="label"><span className="label-text font-semibold">Insight</span></div>
                <textarea
                  className="textarea textarea-bordered w-full h-fit"
                  placeholder="예: 신규 방문자는 가격 대비 품질을 중시, 장바구니 단계 이탈률 18%"
                  value={form.insight}
                  onChange={handle("insight")}
                />
              </label>
            </div>
          </div>
        </div>

        {/* RESULT */}
        <div className="mt-6">
          {copies.length > 0 && (
            <h2 className="mb-3 text-lg font-semibold">결과</h2>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {copies.map((c, i) => (
              <div
                key={i}
                className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="card-body ">
                  <div className="flex items-start gap-2">
                    <div className="badge badge-primary">#{i + 1}</div>
                  </div>
                  <div className="mt-2 space-y-2">
                    <p className="font-semibold leading-6 text-base-content">{c.copy}</p>
                    {c.rationale && (
                      <p className="text-sm text-base-content/70">{c.rationale}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {copies.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-base-300 p-8 text-center text-base-content/60">
                아직 생성된 메시지가 없습니다. 상단 폼을 입력하고 <span className="font-medium">Generate</span>를 눌러보세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}