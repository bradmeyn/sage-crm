import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { toast } from "sonner";
import {
  useFactFindSubmission,
  useImportFactFindSection,
  useCompleteFactFindReview,
} from "../hooks";
import { computeRiskCategory, riskCategoryLabel } from "../schemas";

type SectionDiff = {
  key: string;
  label: string;
  proposed: any;
  current: any;
  changed: boolean;
};

const fmt = (v: unknown) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
};

const prettify = (k: string) =>
  k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

function ObjectDiff({ current, proposed }: { current: any; proposed: any }) {
  const keys = Array.from(
    new Set([...Object.keys(current ?? {}), ...Object.keys(proposed ?? {})]),
  ).filter((k) => fmt(current?.[k]) !== fmt(proposed?.[k]));

  if (keys.length === 0)
    return <p className="text-xs text-muted-foreground">No changes.</p>;

  return (
    <div className="space-y-1.5">
      {keys.map((k) => (
        <div key={k} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
          <span className="text-muted-foreground line-through">
            {fmt(current?.[k])}
          </span>
          <span className="text-muted-foreground">{prettify(k)} →</span>
          <span className="font-medium">{fmt(proposed?.[k])}</span>
        </div>
      ))}
    </div>
  );
}

function RiskDiff({ current, proposed }: { current: any; proposed: any }) {
  const curCat = computeRiskCategory(current?.answers);
  const propCat = computeRiskCategory(proposed?.answers);
  const answered = Object.keys(proposed?.answers ?? {}).length;
  return (
    <div className="space-y-1 text-xs">
      <p className="text-muted-foreground">{answered} questions answered.</p>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground line-through">
          {riskCategoryLabel(curCat)}
        </span>
        <span className="text-muted-foreground">→</span>
        <span className="font-medium">{riskCategoryLabel(propCat)}</span>
      </div>
    </div>
  );
}

function ListDiff({ current, proposed }: { current: any[]; proposed: any[] }) {
  const cur = Array.isArray(current) ? current : [];
  const prop = Array.isArray(proposed) ? proposed : [];
  return (
    <div className="space-y-1.5 text-xs">
      <p className="text-muted-foreground">
        Replaces {cur.length} {cur.length === 1 ? "entry" : "entries"} with{" "}
        {prop.length}:
      </p>
      <ul className="list-disc pl-4">
        {prop.map((item, i) => (
          <li key={i}>{item.name || "Unnamed"}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ReviewSubmissionDialog({
  requestId,
  clientId,
  trigger,
}: {
  requestId: string;
  clientId: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useFactFindSubmission(
    open ? requestId : "",
    open ? clientId : "",
  );
  const importSection = useImportFactFindSection();
  const complete = useCompleteFactFindReview();

  const isList = (key: string) =>
    key === "dependants" || key === "beneficiaries";

  const doImport = (key: string) =>
    importSection.mutate(
      { requestId, clientId, sectionKey: key },
      {
        onSuccess: () => toast.success("Imported"),
        onError: (e: Error) => toast.error(e.message),
      },
    );

  const finish = () =>
    complete.mutate(
      { requestId, clientId },
      {
        onSuccess: () => {
          toast.success("Review complete");
          setOpen(false);
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Review client submission</DialogTitle>
          <DialogDescription>
            Import the sections you want. Your live record only changes when you
            click Import.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !data ? (
          <p className="py-6 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="max-h-[60vh] space-y-4 overflow-auto py-1">
            {data.sections.map((s: SectionDiff) => (
              <div key={s.key} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{s.label}</span>
                    {!s.changed && (
                      <span className="text-xs text-muted-foreground">
                        no change
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={s.changed ? "default" : "outline"}
                    disabled={!s.changed || importSection.isPending}
                    onClick={() => doImport(s.key)}
                  >
                    {s.changed ? "Import" : <Check className="size-4" />}
                  </Button>
                </div>
                {s.key === "risk" ? (
                  <RiskDiff current={s.current} proposed={s.proposed} />
                ) : isList(s.key) ? (
                  <ListDiff current={s.current} proposed={s.proposed} />
                ) : (
                  <ObjectDiff current={s.current} proposed={s.proposed} />
                )}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={finish} disabled={complete.isPending}>
            {complete.isPending ? "Finishing…" : "Finish review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
