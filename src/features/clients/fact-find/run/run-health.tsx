import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateHealth } from "../hooks";
import { useAutosave, saveStatusText } from "../use-autosave";
import { HEALTH_STATUSES } from "../schemas";
import { Field } from "./field";

type Health = {
  smoker: boolean | null;
  healthStatus: string | null;
  heightCm: number | null;
  weightKg: number | null;
};

export default function RunHealth({
  clientId,
  health,
}: {
  clientId: string;
  health: Health;
}) {
  const update = useUpdateHealth();
  const { status, schedule } = useAutosave<Health>((v) =>
    update.mutateAsync({
      clientId,
      smoker: v.smoker,
      healthStatus: v.healthStatus
        ? (v.healthStatus as "EXCELLENT" | "GOOD" | "FAIR" | "POOR")
        : null,
      heightCm: v.heightCm,
      weightKg: v.weightKg,
    }),
  );
  const [v, setV] = useState<Health>(health);
  const set = (patch: Partial<Health>) => {
    const next = { ...v, ...patch };
    setV(next);
    schedule(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end text-xs text-muted-foreground">
        {saveStatusText[status]}
      </div>
      <label className="flex items-center gap-2.5">
        <Checkbox
          checked={!!v.smoker}
          onCheckedChange={(c) => set({ smoker: c === true })}
        />
        <span className="text-sm">Smoker</span>
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Health Status">
          <Select
            value={v.healthStatus ?? ""}
            onValueChange={(val) => set({ healthStatus: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {HEALTH_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Height (cm)">
          <Input
            type="number"
            value={v.heightCm ?? ""}
            onChange={(e) =>
              set({ heightCm: e.target.value ? Number(e.target.value) : null })
            }
          />
        </Field>
        <Field label="Weight (kg)">
          <Input
            type="number"
            value={v.weightKg ?? ""}
            onChange={(e) =>
              set({ weightKg: e.target.value ? Number(e.target.value) : null })
            }
          />
        </Field>
      </div>
    </div>
  );
}
