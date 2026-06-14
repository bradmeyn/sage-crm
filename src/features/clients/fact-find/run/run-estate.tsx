import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSaveEstate } from "../hooks";
import { useAutosave, saveStatusText } from "../use-autosave";
import { POA_TYPES } from "../schemas";
import { Field } from "./field";

type Estate = {
  hasWill: boolean;
  willLocation: string | null;
  executor: string | null;
  hasPoa: boolean;
  poaType: string | null;
  hasGuardianship: boolean;
  notes: string | null;
} | null;

type Values = {
  hasWill: boolean;
  willLocation: string;
  executor: string;
  hasPoa: boolean;
  poaType: string;
  hasGuardianship: boolean;
  notes: string;
};

export default function RunEstate({
  clientId,
  estate,
}: {
  clientId: string;
  estate: Estate;
}) {
  const save = useSaveEstate();
  const { status, schedule } = useAutosave<Values>((v) =>
    save.mutateAsync({
      clientId,
      hasWill: v.hasWill,
      willLocation: v.willLocation,
      executor: v.executor,
      hasPoa: v.hasPoa,
      poaType: v.poaType
        ? (v.poaType as "FINANCIAL" | "MEDICAL" | "BOTH")
        : undefined,
      hasGuardianship: v.hasGuardianship,
      notes: v.notes,
    }),
  );
  const [v, setV] = useState<Values>(() => ({
    hasWill: estate?.hasWill ?? false,
    willLocation: estate?.willLocation ?? "",
    executor: estate?.executor ?? "",
    hasPoa: estate?.hasPoa ?? false,
    poaType: estate?.poaType ?? "",
    hasGuardianship: estate?.hasGuardianship ?? false,
    notes: estate?.notes ?? "",
  }));
  const set = (patch: Partial<Values>) => {
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
        <Checkbox checked={v.hasWill} onCheckedChange={(c) => set({ hasWill: c === true })} />
        <span className="text-sm">Has a will</span>
      </label>
      {v.hasWill && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Will Location">
            <Input value={v.willLocation} onChange={(e) => set({ willLocation: e.target.value })} />
          </Field>
          <Field label="Executor">
            <Input value={v.executor} onChange={(e) => set({ executor: e.target.value })} />
          </Field>
        </div>
      )}
      <label className="flex items-center gap-2.5">
        <Checkbox checked={v.hasPoa} onCheckedChange={(c) => set({ hasPoa: c === true })} />
        <span className="text-sm">Power of Attorney in place</span>
      </label>
      {v.hasPoa && (
        <Field label="POA Type">
          <Select value={v.poaType} onValueChange={(val) => set({ poaType: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {POA_TYPES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
      <label className="flex items-center gap-2.5">
        <Checkbox
          checked={v.hasGuardianship}
          onCheckedChange={(c) => set({ hasGuardianship: c === true })}
        />
        <span className="text-sm">Guardianship arrangements in place</span>
      </label>
      <Field label="Notes">
        <Textarea rows={3} value={v.notes} onChange={(e) => set({ notes: e.target.value })} />
      </Field>
    </div>
  );
}
