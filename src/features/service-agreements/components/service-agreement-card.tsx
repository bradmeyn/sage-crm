import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  useRecordConsent,
  useDeleteServiceAgreement,
} from "@/features/service-agreements/hooks";
import ServiceAgreementDialog from "./service-agreement-dialog";
import type { ServiceAgreement } from "@/db/schema";
import type { AgreementStatus } from "@/server/functions/service-agreements";

const STATUS_BADGE: Record<
  AgreementStatus,
  { label: string; className: string }
> = {
  ACTIVE: { label: "Active", className: "bg-emerald-100 text-emerald-700" },
  RENEWAL_DUE: {
    label: "Renewal Due",
    className: "bg-amber-100 text-amber-700",
  },
  OVERDUE: { label: "Overdue", className: "bg-orange-100 text-orange-700" },
  LAPSED: { label: "Lapsed", className: "bg-red-100 text-red-700" },
};

const FREQ_LABEL: Record<string, string> = {
  MONTHLY: "month",
  QUARTERLY: "quarter",
  ANNUALLY: "year",
};

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFee(cents: number, frequency: string) {
  const dollars = (cents / 100).toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });
  return `${dollars} / ${FREQ_LABEL[frequency] ?? frequency.toLowerCase()}`;
}

function renewalWindow(nextRenewalDate: string) {
  const renewal = new Date(nextRenewalDate);
  const open = new Date(renewal);
  open.setDate(open.getDate() - 60);
  const close = new Date(renewal);
  close.setDate(close.getDate() + 150);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  return `${fmt(open)} → ${fmt(close)}`;
}

interface Props {
  agreement: ServiceAgreement & { status: AgreementStatus };
  clientId: string;
}

export default function ServiceAgreementCard({ agreement, clientId }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const recordConsent = useRecordConsent(clientId);
  const deleteAgreement = useDeleteServiceAgreement(clientId);
  const badge = STATUS_BADGE[agreement.status];

  const handleRecordConsent = () => {
    recordConsent.mutate(agreement.id, {
      onSuccess: () =>
        toast.success("Consent recorded — renewal date advanced by 12 months"),
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this service agreement? This cannot be undone."))
      return;
    deleteAgreement.mutate(agreement.id, {
      onSuccess: () => toast.success("Agreement deleted"),
      onError: (err: Error) => toast.error(err.message),
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Ongoing Service Agreement</h3>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                {badge.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRecordConsent}
                disabled={
                  agreement.status === "ACTIVE" || recordConsent.isPending
                }
                title={
                  agreement.status === "ACTIVE"
                    ? "Consent not yet due"
                    : "Record client consent"
                }>
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Record Consent
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setEditOpen(true)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
                disabled={deleteAgreement.isPending}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <Row
              label="Annual Fee"
              value={formatFee(agreement.feeAmount, agreement.feeFrequency)}
            />
            <Row label="Start Date" value={formatDate(agreement.startDate)} />
            <Row
              label="Next Renewal"
              value={formatDate(agreement.nextRenewalDate)}
            />
            <Row
              label="Last Consent"
              value={
                agreement.lastConsentDate
                  ? formatDate(agreement.lastConsentDate)
                  : "—"
              }
            />
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Renewal Window
            </p>
            <p className="text-sm">
              {renewalWindow(agreement.nextRenewalDate)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              60 days before to 150 days after anniversary (ASIC requirement)
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Services Included
            </p>
            <p className="text-sm whitespace-pre-wrap">{agreement.services}</p>
          </div>

          {agreement.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Notes
              </p>
              <p className="text-sm text-muted-foreground">{agreement.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ServiceAgreementDialog
        clientId={clientId}
        agreement={agreement}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  );
}
