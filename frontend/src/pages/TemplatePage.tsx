import { useState } from "react";
import { api } from "../api";

export default function TemplatePage() {
  const [form, setForm] = useState({
    business_desc: "",
    funnel_stage: "Acquisition",
    tone: "Friendly",
    insight: "",
  });

  const funenelList = ["Acquisition", "Activation", "Retention", "Win-back"]
  const toneList = ["Friendly", "Urgent", "Empathetic"]
  const [copies, setCopies] = useState<any[]>([]);

  const handle = (k: string) => (e: any) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    const { data } = await api.post("/templates", form);
    setCopies(data);
  };

  return (
    <section style={{ padding: 32 }}>
      <input placeholder="Business" onChange={handle("business_desc")} />
      <select onChange={handle("funnel_stage")}>
        {funenelList.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
      <select onChange={handle("tone")}>
        {toneList.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
      <textarea
        placeholder="Insight"
        rows={3}
        onChange={handle("insight")}
      />
      <button onClick={submit}>Generate</button>

      <ul>
        {copies.map((c, i) => (
          <li key={i}>
            {c.copy} <small>({c.rationale})</small>
          </li>
        ))}
      </ul>
    </section>
  );
}