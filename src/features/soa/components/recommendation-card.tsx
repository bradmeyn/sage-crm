import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import {
  useAutosave,
  saveStatusText,
} from "@/features/clients/fact-find/use-autosave";
import { useUpdateRecommendation } from "../hooks";
import { strategyCategoryLabel } from "../schemas";
import DotPointList from "./dot-point-list";
import TypedFields from "./typed-fields";

type Rec = {
  id: string;
  category: string;
  type: string;
  title: string;
  wording: string | null;
  benefits: string[];
  warnings: string[];
  data: Record<string, any>;
  goalIds: string[];
};

type Goal = { id: string; name: string };

type State = {
  title: string;
  wording: string;
  benefits: string[];
  warnings: string[];
  data: Record<string, any>;
  goalIds: string[];
};

export default function RecommendationCard({
  rec,
  soaId,
  goals,
  index,
  count,
  onMove,
  onDelete,
}: {
  rec: Rec;
  soaId: string;
  goals: Goal[];
  index: number;
  count: number;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
}) {
  const update = useUpdateRecommendation();
  const { status, schedule } = useAutosave<State>((s) =>
    update.mutateAsync({ recommendationId: rec.id, soaId, ...s }),
  );
  const [s, setS] = useState<State>(() => ({
    title: rec.title,
    wording: rec.wording ?? "",
    benefits: rec.benefits ?? [],
    warnings: rec.warnings ?? [],
    data: rec.data ?? {},
    goalIds: rec.goalIds ?? [],
  }));

  const patch = (p: Partial<State>) => {
    const next = { ...s, ...p };
    setS(next);
    schedule(next);
  };

  const toggleGoal = (goalId: string) =>
    patch({
      goalIds: s.goalIds.includes(goalId)
        ? s.goalIds.filter((g) => g !== goalId)
        : [...s.goalIds, goalId],
    });

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {strategyCategoryLabel(rec.category)}
        </span>
        <div className="flex items-center gap-1">
          <span className="mr-2 text-xs text-muted-foreground">
            {saveStatusText[status]}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={index === count - 1}
            onClick={() => onMove(1)}
          >
            <ChevronDown className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <Input
        value={s.title}
        onChange={(e) => patch({ title: e.target.value })}
        className="mb-3 text-base font-medium"
      />

      {rec.type !== "GENERIC" && (
        <div className="mb-3">
          <TypedFields
            type={rec.type}
            data={s.data}
            onChange={(d) => patch({ data: d })}
          />
        </div>
      )}

      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        Recommendation
      </Label>
      <Textarea
        value={s.wording}
        onChange={(e) => patch({ wording: e.target.value })}
        rows={4}
        className="mb-4"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <DotPointList
          label="Benefits"
          points={s.benefits}
          onChange={(b) => patch({ benefits: b })}
          accent="benefit"
        />
        <DotPointList
          label="Warnings"
          points={s.warnings}
          onChange={(w) => patch({ warnings: w })}
          accent="warning"
        />
      </div>

      {goals.length > 0 && (
        <div className="mt-4">
          <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Linked goals
          </Label>
          <div className="flex flex-wrap gap-2">
            {goals.map((g) => {
              const on = s.goalIds.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGoal(g.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    on
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
