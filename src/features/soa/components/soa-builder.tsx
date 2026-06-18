import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  X,
  FileText,
  FileType,
  Download,
  ChevronDown,
  CheckCircle2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAutosave,
  saveStatusText,
} from "@/features/clients/fact-find/use-autosave";
import { useFactFind } from "@/features/clients/fact-find/hooks";
import { riskCategoryLabel } from "@/features/clients/fact-find/schemas";
import { exportSoa } from "@/server/functions/soa";
import {
  useSoa,
  useUpdateSoa,
  useAddRecommendation,
  useDeleteRecommendation,
  useReorderRecommendations,
} from "../hooks";
import StrategyPickerDialog from "./strategy-picker-dialog";
import RecommendationCard from "./recommendation-card";

const SECTIONS = [
  { key: "scope", label: "Scope" },
  { key: "intro", label: "Introduction" },
  { key: "recommendations", label: "Recommendations" },
  { key: "review", label: "Review & Export" },
] as const;

type Meta = { title: string; scope: string; intro: string };

export default function SoaBuilder({ soaId }: { soaId: string }) {
  const { data: soa, isLoading } = useSoa(soaId);
  const clientId = soa?.clientId ?? "";
  const { data: factFind } = useFactFind(clientId);

  const updateSoa = useUpdateSoa();
  const addRec = useAddRecommendation();
  const delRec = useDeleteRecommendation();
  const reorder = useReorderRecommendations();

  const { status, schedule } = useAutosave<Meta>((v) =>
    updateSoa.mutateAsync({
      soaId,
      title: v.title,
      scope: v.scope,
      intro: v.intro,
    }),
  );
  const [meta, setMeta] = useState<Meta>({ title: "", scope: "", intro: "" });
  const [hydrated, setHydrated] = useState(false);
  const [active, setActive] = useState(0);
  const [downloading, setDownloading] = useState<"pdf" | "docx" | null>(null);

  if (soa && !hydrated) {
    setMeta({ title: soa.title, scope: soa.scope ?? "", intro: soa.intro ?? "" });
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
  const issued = soa.status === "ISSUED";

  const setMetaField = (p: Partial<Meta>) => {
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

  const toggleStatus = () => {
    const next = issued ? "DRAFT" : "ISSUED";
    updateSoa.mutate(
      { soaId, status: next },
      {
        onSuccess: () =>
          toast.success(next === "ISSUED" ? "SOA issued" : "Reverted to draft"),
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };

  const handleExport = async (format: "pdf" | "docx") => {
    setDownloading(format);
    try {
      const { filename, base64 } = await exportSoa({ data: { soaId, format } });
      const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
      const mime =
        format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to export");
    } finally {
      setDownloading(null);
    }
  };

  const currentKey = SECTIONS[active].key;

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Statement of Advice · {clientName}
            </p>
            <Badge variant={issued ? "default" : "secondary"}>
              {issued ? "Issued" : "Draft"}
            </Badge>
          </div>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!!downloading}>
                <Download className="size-4" />
                {downloading ? "Preparing…" : "Export"}
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileText className="size-4" />
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("docx")}>
                <FileType className="size-4" />
                Word (.docx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" asChild>
            <Link to="/clients/$clientId/soa" params={{ clientId }}>
              <X className="size-4" />
              Exit
            </Link>
          </Button>
        </div>
      </div>

      {/* Client context (always visible) */}
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
      </Card>

      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        {/* Rail */}
        <nav className="flex h-fit flex-col gap-0.5">
          {SECTIONS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActive(i)}
              className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                i === active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        {/* Active section */}
        <div>
          {currentKey === "scope" && (
            <Card className="p-6">
              <Label className="mb-1.5 block text-sm font-medium">
                Scope of advice
              </Label>
              <p className="mb-3 text-xs text-muted-foreground">
                What this advice covers, and any exclusions.
              </p>
              <Textarea
                value={meta.scope}
                onChange={(e) => setMetaField({ scope: e.target.value })}
                rows={5}
                placeholder="What this advice covers (and any exclusions)…"
              />
            </Card>
          )}

          {currentKey === "intro" && (
            <Card className="p-6">
              <Label className="mb-1.5 block text-sm font-medium">
                Introduction
              </Label>
              <p className="mb-3 text-xs text-muted-foreground">
                Opening summary that sets the context for the advice.
              </p>
              <Textarea
                value={meta.intro}
                onChange={(e) => setMetaField({ intro: e.target.value })}
                rows={6}
                placeholder="Introduce the advice, the client's circumstances and objectives…"
              />
            </Card>
          )}

          {currentKey === "recommendations" && (
            <div>
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
          )}

          {currentKey === "review" && (
            <Card className="p-6">
              <h2 className="heading-secondary mb-1">Review & Export</h2>
              <p className="mb-5 text-sm text-muted-foreground">
                {recs.length} recommendation{recs.length === 1 ? "" : "s"} ·{" "}
                {issued ? "Issued" : "Draft"}
              </p>

              <div className="mb-6 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleExport("pdf")}
                  disabled={!!downloading}
                >
                  <FileText className="size-4" />
                  {downloading === "pdf" ? "Preparing…" : "Download PDF"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport("docx")}
                  disabled={!!downloading}
                >
                  <FileType className="size-4" />
                  {downloading === "docx" ? "Preparing…" : "Download Word"}
                </Button>
              </div>

              <div className="border-t pt-5">
                <p className="mb-1 text-sm font-medium">
                  {issued ? "This SOA has been issued" : "Issue this SOA"}
                </p>
                <p className="mb-3 text-xs text-muted-foreground">
                  {issued
                    ? "Revert to draft to make further changes."
                    : "Mark the advice as finalised and issued to the client."}
                </p>
                <Button
                  variant={issued ? "outline" : "default"}
                  onClick={toggleStatus}
                  disabled={updateSoa.isPending}
                >
                  {issued ? (
                    <>
                      <Undo2 className="size-4" />
                      Revert to draft
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      Mark as issued
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
