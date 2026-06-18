import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAutosave,
  saveStatusText,
} from "@/features/clients/fact-find/use-autosave";
import { useUpdateClient } from "@/features/clients/hooks";
import { CLIENT_STATUSES, LEAD_SOURCES } from "@/features/clients/schemas";
import type { ClientWithPartner } from "@/server/functions/clients";

type Status = (typeof CLIENT_STATUSES)[number]["value"];
type Lead = (typeof LEAD_SOURCES)[number]["value"];

type State = {
  status: Status;
  leadSource: Lead | "";
  clientSince: string;
  isVulnerable: boolean;
  vulnerabilityNote: string;
};

export default function ClientPracticeCard({
  client,
}: {
  client: ClientWithPartner;
}) {
  const update = useUpdateClient();
  const { status: saveStatus, schedule } = useAutosave<State>((s) =>
    update.mutateAsync({
      clientId: client.id,
      status: s.status,
      leadSource: s.leadSource || undefined,
      clientSince: s.clientSince,
      isVulnerable: s.isVulnerable,
      vulnerabilityNote: s.vulnerabilityNote,
    }),
  );

  const [s, setS] = useState<State>(() => ({
    status: (client.status as Status) ?? "PROSPECT",
    leadSource: (client.leadSource as Lead) ?? "",
    clientSince: client.clientSince ?? "",
    isVulnerable: client.isVulnerable ?? false,
    vulnerabilityNote: client.vulnerabilityNote ?? "",
  }));

  const patch = (p: Partial<State>) => {
    const next = { ...s, ...p };
    setS(next);
    schedule(next);
  };

  return (
    <div className="mb-6 max-w-xl">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Practice details</h3>
        <span className="text-xs text-muted-foreground">
          {saveStatusText[saveStatus]}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-sm text-muted-foreground">
            Status
          </Label>
          <Select
            value={s.status}
            onValueChange={(v) => patch({ status: v as Status })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLIENT_STATUSES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 block text-sm text-muted-foreground">
            Lead source
          </Label>
          <Select
            value={s.leadSource}
            onValueChange={(v) => patch({ leadSource: v as Lead })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_SOURCES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 block text-sm text-muted-foreground">
            Client since
          </Label>
          <Input
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={s.clientSince}
            onChange={(e) => patch({ clientSince: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={s.isVulnerable}
            onCheckedChange={(c) => patch({ isVulnerable: c === true })}
          />
          Vulnerable client
        </label>
        {s.isVulnerable && (
          <Input
            className="mt-2"
            placeholder="Note (nature of vulnerability, support needs)…"
            value={s.vulnerabilityNote}
            onChange={(e) => patch({ vulnerabilityNote: e.target.value })}
          />
        )}
      </div>
    </div>
  );
}
