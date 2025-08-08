import { useReducer, useState, useCallback, useEffect } from "react";
import { api } from "../api";
import { useLocation } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import SortableItem from "../components/SortableItem";

type Role = "Dev" | "PM" | "Design";
type Severity = "Low" | "Medium" | "High";
type Card = { id: string; title: string; severity: Severity };

type State = Record<Role, Card[]>;

const roles: Role[] = ["Dev", "PM", "Design"];
const emptyState: State = { Dev: [], PM: [], Design: [] };

/* ---------------- reducer ---------------- */
type Action =
  | { type: "SET"; payload: State }
  | { type: "MOVE"; role: Role; list: Card[] };

function boardReducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET":
      return action.payload;
    case "MOVE":
      return { ...state, [action.role]: action.list };
    default:
      return state;
  }
}

/* ---------------- utils ---------------- */
const sevColor: Record<Severity, string> = {
  High: "bg-red-500",
  Medium: "bg-yellow-500",
  Low: "bg-green-500",
};


function buildStateFromData(data: any): State {
  const next: State = { Dev: [], PM: [], Design: [] };
  const sev = (data?.severity as Severity) ?? "Medium";
  const normalize = (v: unknown): string[] => {
    if (!v) return [];
    if (Array.isArray(v)) return v as string[];
    if (typeof v === "object") return Object.values(v as Record<string, string>);
    return [];
  };
  (roles as Role[]).forEach((role) => {
    const items = normalize(data?.tasks?.[role]);
    items.forEach((t: string, idx: number) => {
      next[role].push({
        id: `${role}-${Date.now()}-${idx}`,
        title: t,
        severity: sev,
      });
    });
  });
  return next;
}

export default function BoardPage() {
  const [state, dispatch] = useReducer(boardReducer, emptyState);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));
  const location = useLocation();

  /* -------- ask research → create issue -------- */
  const createIssue = useCallback(async (seed?: string) => {
    if (loading) return; // prevent double submit
    const raw = (typeof seed === "string" ? seed : undefined) ?? question;
    const q = (raw ?? "").toString().trim();
    if (!q) return;
    setLoading(true);
    try {
      const { data } = await api.post("/issues", { question: q });

      // Build board state directly from returned tasks
      const next: State = { Dev: [], PM: [], Design: [] };
      const sev = (data?.severity as Severity) ?? "Medium";
      (Object.keys(data?.tasks || {}) as Role[]).forEach((role) => {
        (data.tasks[role] || []).forEach((t: string, idx: number) => {
          next[role].push({
            id: `${role}-${Date.now()}-${idx}`,
            title: t,
            severity: sev,
          });
        });
      });

      dispatch({ type: "SET", payload: next });
      if (!seed) setQuestion("");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to create issue";
      alert(msg);
    } finally {
      setLoading(false);
    }
  }, [question, loading]);

  useEffect(() => {
    const st = (location.state as any) || {};
    const seed: string | undefined = st?.seed;
    const prefill: any | undefined = st?.prefill;
    if (prefill && prefill.tasks) {
      // Directly render provided data
      dispatch({ type: "SET", payload: buildStateFromData(prefill) });
      // Keep the previous input content if provided
      if (seed && seed.trim()) setQuestion(seed);
      return;
    }
    if (seed && seed.trim()) {
      setQuestion(seed);
      void createIssue(seed);
    }
  }, [location.state, createIssue]);

  /* -------- drag end -------- */
  function handleDragEnd(e: any) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const [fromRole] = (active.id as string).split("-") as [Role];
    const [toRole] = (over.id as string).split("-") as [Role];

    /* 이동 대상 Card 찾기 */
    const fromIdx = state[fromRole].findIndex((c) => c.id === active.id);
    const toIdx = state[toRole].findIndex((c) => c.id === over.id);

    /* 같은 컬럼 => 순서만 변경 */
    if (fromRole === toRole) {
      dispatch({
        type: "MOVE",
        role: fromRole,
        list: arrayMove(state[fromRole], fromIdx, toIdx),
      });
    } else {
      /* 다른 컬럼 => 꺼내서 삽입 */
      const moving = { ...state[fromRole][fromIdx], severity: state[fromRole][fromIdx].severity };
      const fromList = [...state[fromRole]];
      fromList.splice(fromIdx, 1);
      const toList = [...state[toRole]];
      toList.splice(toIdx + 1, 0, moving);

      dispatch({ type: "MOVE", role: fromRole, list: fromList });
      dispatch({ type: "MOVE", role: toRole, list: toList });
    }
  }

  /* -------- render -------- */
  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <h2 className="text-2xl font-semibold mb-6">Issue Board</h2>

      {/* 질문 입력 */}
      <div className="flex mb-6 gap-2">
        <input
          className="border p-2 flex-1 rounded"
          placeholder="Ask a research question…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          onClick={() => createIssue()}
          disabled={loading}
          className="border px-4 py-2 rounded bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Ask"}
        </button>
      </div>

      {/* 보드 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto">
          {roles.map((role) => (
            <div key={role} className="w-1/3 min-w-[260px]">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                {role}
                {state[role].length > 0 && (
                  <span className="text-xs text-gray-500">
                    {state[role].length}
                  </span>
                )}
              </h3>

              <SortableContext
                items={state[role].map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {state[role].map((c) => (
                    <SortableItem key={c.id} id={c.id}>
                      <div className="border p-3 rounded bg-white shadow">
                        <p className="text-sm">{c.title}</p>
                        <span
                          className={`inline-block mt-1 text-[10px] text-white px-2 py-[2px] rounded ${sevColor[c.severity]}`}
                        >
                          {c.severity}
                        </span>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>
    </section>
  );
}