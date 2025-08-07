import { useReducer, useState, useCallback } from "react";
import { api } from "../api";
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

export default function BoardPage() {
  const [state, dispatch] = useReducer(boardReducer, emptyState);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  /* -------- ask research → create issue -------- */
  const createIssue = useCallback(async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/issues", { question });
      /* data.tasks = {Dev:[...], PM:[...], ...} */
      const next: State = { Dev: [], PM: [], Design: [] };

      (Object.keys(data.tasks) as Role[]).forEach((role) => {
        data.tasks[role].forEach((t: string, idx: number) => {
          next[role].push({
            id: `${role}-${Date.now()}-${idx}`,
            title: t,
            severity: data.severity as Severity,
          });
        });
      });

      dispatch({ type: "SET", payload: next });  // 🔄 전체 교체
      setQuestion("");
    } finally {
      setLoading(false);
    }
  }, [question]);

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
    <section className="p-6 max-w-7xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Research → Issue Board</h2>

      {/* 질문 입력 */}
      <div className="flex mb-6 gap-2">
        <input
          className="border p-2 flex-1 rounded"
          placeholder="Ask a research question…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          onClick={createIssue}
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
                <span className="text-xs text-gray-500">
                  {state[role].length}
                </span>
              </h3>

              <SortableContext
                items={state[role]}
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