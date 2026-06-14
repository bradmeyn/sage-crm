import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSaveRiskProfile } from "../hooks";
import { useAutosave, saveStatusText } from "../use-autosave";
import {
  RISK_QUESTIONS,
  RISK_CATEGORIES,
  computeRiskCategory,
  riskCategoryLabel,
} from "../schemas";
import { Field } from "./field";

type Risk = {
  answers: Record<string, number>;
  category: string | null;
  confirmedCategory: string | null;
} | null;

type State = {
  answers: Record<string, number>;
  confirmedCategory: string;
};

export default function RunRiskProfile({
  clientId,
  riskProfile,
}: {
  clientId: string;
  riskProfile: Risk;
}) {
  const save = useSaveRiskProfile();
  const { status, schedule } = useAutosave<State>((s) =>
    save.mutateAsync({
      clientId,
      answers: s.answers,
      confirmedCategory: s.confirmedCategory
        ? (s.confirmedCategory as
            | "CONSERVATIVE"
            | "MODERATELY_CONSERVATIVE"
            | "BALANCED"
            | "GROWTH"
            | "HIGH_GROWTH")
        : null,
    }),
  );
  const [state, setState] = useState<State>(() => ({
    answers: riskProfile?.answers ?? {},
    confirmedCategory: riskProfile?.confirmedCategory ?? "",
  }));

  const computed = computeRiskCategory(state.answers);

  const update = (next: State) => {
    setState(next);
    schedule(next);
  };
  const pick = (qid: string, weight: number) =>
    update({ ...state, answers: { ...state.answers, [qid]: weight } });

  return (
    <div className="space-y-6">
      <div className="flex justify-end text-xs text-muted-foreground">
        {saveStatusText[status]}
      </div>

      {RISK_QUESTIONS.map((q, i) => (
        <div key={q.id}>
          <p className="mb-2 text-sm font-medium">
            {i + 1}. {q.text}
          </p>
          <div className="flex flex-col gap-1.5">
            {q.options.map((opt) => {
              const selected = state.answers[q.id] === opt.weight;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => pick(q.id, opt.weight)}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    selected
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Computed result</span>
          <span className="text-sm font-medium">
            {riskCategoryLabel(computed)}
          </span>
        </div>
        <div className="mt-4 max-w-xs">
          <Field label="Confirmed category (adviser)">
            <Select
              value={state.confirmedCategory}
              onValueChange={(v) => update({ ...state, confirmedCategory: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Use computed result" />
              </SelectTrigger>
              <SelectContent>
                {RISK_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
    </div>
  );
}
