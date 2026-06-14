import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Download, ClipboardCheck, Play, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  useFactFind,
  useFactFindRequests,
} from "@/features/clients/fact-find/hooks";
import { exportFactFind } from "@/server/functions/fact-find";
import SendFactFindDialog from "./send-fact-find-dialog";
import ReviewSubmissionDialog from "./review-submission-dialog";

type SectionStatus = "complete" | "partial" | "empty";

const STATUS_TEXT: Record<SectionStatus, string> = {
  complete: "Complete",
  partial: "Started",
  empty: "Not started",
};

function StatusDot({ status }: { status: SectionStatus }) {
  const cls =
    status === "complete"
      ? "bg-primary"
      : status === "partial"
        ? "bg-amber-500"
        : "border border-muted-foreground/40";
  return <span className={`size-2.5 rounded-full shrink-0 ${cls}`} />;
}

export default function FactFindShell({ clientId }: { clientId: string }) {
  const { data, isLoading } = useFactFind(clientId);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { filename, base64 } = await exportFactFind({ data: { clientId } });
      const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
      const url = URL.createObjectURL(
        new Blob([bytes], { type: "application/pdf" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Loading fact find…</p>
      </Card>
    );
  }

  const { sections, completeness } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <RequestStatus clientId={clientId} />
        <div className="flex items-center gap-2">
          <SendFactFindDialog clientId={clientId} sections={sections} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download className="size-4" />
            {downloading ? "Preparing…" : "Download PDF"}
          </Button>
          <Button size="sm" asChild>
            <Link to="/fact-find/$clientId" params={{ clientId }}>
              <Play className="size-4" />
              Run fact find
            </Link>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <p className="text-2xl font-semibold tabular-nums">
              {completeness}%
            </p>
            <p className="text-sm text-muted-foreground">complete</p>
          </div>
          <div className="w-1/2 max-w-xs">
            <Progress value={completeness} className="h-2" />
          </div>
        </div>

        <div className="divide-y">
          {sections.map((s) => (
            <Link
              key={s.key}
              to="/fact-find/$clientId"
              params={{ clientId }}
              search={{ section: s.key }}
              className="group flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-3">
                <StatusDot status={s.status} />
                <span className="text-sm font-medium">{s.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {STATUS_TEXT[s.status]}
                </span>
                <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING: {
    label: "Sent · awaiting client",
    cls: "bg-amber-100 text-amber-800",
  },
  SUBMITTED: {
    label: "Submitted · ready to review",
    cls: "bg-primary/10 text-primary",
  },
  IMPORTED: { label: "Imported", cls: "bg-muted text-muted-foreground" },
  EXPIRED: { label: "Link expired", cls: "bg-muted text-muted-foreground" },
  REVOKED: { label: "Link revoked", cls: "bg-muted text-muted-foreground" },
};

function RequestStatus({ clientId }: { clientId: string }) {
  const { data: requests } = useFactFindRequests(clientId);
  const latest = requests?.[0];
  if (!latest) return <span />;
  const s = STATUS_LABELS[latest.status];
  if (!s) return <span />;
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}
      >
        {s.label}
      </span>
      {latest.status === "SUBMITTED" && (
        <ReviewSubmissionDialog
          requestId={latest.id}
          clientId={clientId}
          trigger={
            <Button size="sm">
              <ClipboardCheck className="size-4" />
              Review
            </Button>
          }
        />
      )}
    </div>
  );
}
