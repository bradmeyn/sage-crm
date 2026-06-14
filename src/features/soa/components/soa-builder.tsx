import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  useAutosave,
  saveStatusText,
} from "@/features/clients/fact-find/use-autosave";
import { useFactFind } from "@/features/clients/fact-find/hooks";
import { riskCategoryLabel } from "@/features/clients/fact-find/schemas";
import {
  useSoa,
  useUpdateSoa,
  useAddRecommendation,
  useDeleteRecommendation,
  useReorderRecommendations,
} from "../hooks";
import StrategyPickerDialog from "./strategy-picker-dialog";
import RecommendationCard from "./recommendation-card";

export default function SoaBuilder({ soaId }: { soaId: string }) {
  const { data: soa, isLoading } = useSoa(soaId);
  const clientId = soa?.clientId ?? "";
  const { data: factFind } = useFactFind(clientId);

  const updateSoa = useUpdateSoa();
  const addRec = useAddRecommendation();
  const delRec = useDeleteRecommendation();
  const reorder = useReorderRecommendations();

  const { status, schedule } = useAutosave<{ title: string; scope: string }>(
    (v) => updateSoa.mutateAsync({ soaId, title: v.title, scope: v.scope }),
  );
  const [meta, setMeta] = useState({ title: "", scope: "" });
  // Initialise meta once the SOA loads.
  const [hydrated, setHydrated] = useState(false);
  if (soa && !hydrated) {
    setMeta({ title: soa.title, scope: soa.scope ?? "" });
    setHydrated(true);
  }

  if (isLoading || !soa) {
    return <p className="p-8 text-sm text-muted-foreground">Loading…</p>;
  }

  const recs = soa.recommendations;
  const goals = (factFind?.client.goals ?? []).map((g) => ({
    id: g.id,
    name: g.name,
  }));
  const riskCat =
    factFind?.riskProfile?.confirmedCategory ?? factFind?.riskProfile?.category;
  const clientName = factFind
    ? `${factFind.client.firstName} ${factFind.client.lastName}`
    : "";

  const setMetaField = (p: Partial<typeof meta>) => {
    const next = { ...meta, ...p };
    setMeta(next);
    schedule(next);
  };

  const move = (index: number, dir: -1 | 1) => {
    const ids = recs.map((r) => r.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    reorder.mutate({ soaId, orderedIds: ids });
  };

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Statement of Advice · {clientName}
          </p>
          <Input
            value={meta.title}
            onChange={(e) => setMetaField({ title: e.target.value })}
            className="mt-1 h-auto border-0 px-0 font-serif text-2xl font-light shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {saveStatusText[status]}
          </span>
          <Button variant="outline" size="sm" disabled title="Coming in the next step">
            <FileText className="size-4" />
            Generate PDF
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/clients/$clientId/soa" params={{ clientId }}>
              <X className="size-4" />
              Exit
            </Link>
          </Button>
        </div>
      </div>

      {/* Context from the fact find */}
      <Card className="mb-6 p-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Client context
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Client</p>
            <p className="text-sm font-medium">{clientName || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Risk profile</p>
            <p className="text-sm font-medium">{riskCategoryLabel(riskCat)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Goals</p>
            <p className="text-sm font-medium">
              {goals.length ? goals.map((g) => g.name).join(", ") : "—"}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Label className="mb-1.5 block text-xs text-muted-foreground">
            Scope of advice
          </Label>
          <Textarea
            value={meta.scope}
            onChange={(e) => setMetaField({ scope: e.target.value })}
            rows={2}
            placeholder="What this advice covers (and any exclusions)…"
          />
        </div>
      </Card>

      {/* Recommendations */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="heading-secondary">Recommendations</h2>
        <StrategyPickerDialog
          pending={addRec.isPending}
          onAdd={(args) =>
            addRec.mutate(
              { soaId, ...args },
              { onError: (e: Error) => toast.error(e.message) },
            )
          }
        />
      </div>

      {recs.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No recommendations yet. Add one from the strategy library.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {recs.map((rec, i) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              soaId={soaId}
              goals={goals}
              index={i}
              count={recs.length}
              onMove={(dir) => move(i, dir)}
              onDelete={() =>
                delRec.mutate(
                  { recommendationId: rec.id, soaId },
                  { onError: (e: Error) => toast.error(e.message) },
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
