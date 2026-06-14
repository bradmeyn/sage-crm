import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  saveFactFind,
  submitFactFind,
} from "@/server/functions/fact-find-portal";
import {
  DEPENDANT_RELATIONSHIPS,
  POA_TYPES,
  BENEFICIARY_RELATIONSHIPS,
  BENEFICIARY_APPLIES_TO,
  HEALTH_STATUSES,
  RISK_QUESTIONS,
} from "../schemas";

type Section = { key: string; label: string };
type Responses = Record<string, any>;

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export default function ClientFactFindForm({
  token,
  dateOfBirth,
  clientName,
  sections,
  initialData,
}: {
  token: string;
  dateOfBirth: string;
  clientName: string;
  sections: Section[];
  initialData: Responses;
}) {
  const [responses, setResponses] = useState<Responses>(initialData);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const setSection = (key: string, value: unknown) =>
    setResponses((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await saveFactFind({ data: { token, dateOfBirth, responses } });
      toast.success("Progress saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await submitFactFind({ data: { token, dateOfBirth, responses } });
      setDone(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Card className="p-10 text-center">
        <CheckCircle2 className="mx-auto size-10 text-primary" />
        <h2 className="heading-secondary mt-4">Thank you</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your details have been sent to your adviser. You can close this page.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((s) => (
        <Card key={s.key} className="p-6">
          <h2 className="heading-secondary mb-5">{s.label}</h2>
          {s.key === "personal" && (
            <PersonalFields
              value={responses.personal ?? {}}
              onChange={(v) => setSection("personal", v)}
            />
          )}
          {s.key === "dependants" && (
            <DependantsFields
              value={responses.dependants ?? []}
              onChange={(v) => setSection("dependants", v)}
            />
          )}
          {s.key === "estate" && (
            <EstateFields
              value={responses.estate ?? {}}
              onChange={(v) => setSection("estate", v)}
            />
          )}
          {s.key === "beneficiaries" && (
            <BeneficiariesFields
              value={responses.beneficiaries ?? []}
              onChange={(v) => setSection("beneficiaries", v)}
            />
          )}
          {s.key === "health" && (
            <HealthFields
              value={responses.health ?? {}}
              onChange={(v) => setSection("health", v)}
            />
          )}
          {s.key === "risk" && (
            <RiskFields
              value={responses.risk ?? { answers: {} }}
              onChange={(v) => setSection("risk", v)}
            />
          )}
        </Card>
      ))}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={save} disabled={saving || submitting}>
          {saving ? "Saving…" : "Save progress"}
        </Button>
        <Button onClick={submit} disabled={submitting || saving}>
          {submitting ? "Submitting…" : "Submit to adviser"}
        </Button>
      </div>
    </div>
  );
}

// ─── Section field groups ────────────────────────────────────────────────────

function PersonalFields({
  value,
  onChange,
}: {
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const set = (k: string, v: string) => onChange({ ...value, [k]: v });
  const text = (k: string) => value[k] ?? "";
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title">
          <Input value={text("title")} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Date of Birth">
          <Input
            type="date"
            value={text("dateOfBirth")}
            onChange={(e) => set("dateOfBirth", e.target.value)}
          />
        </Field>
        <Field label="Email">
          <Input value={text("email")} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={text("phone")} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Occupation">
          <Input value={text("occupation")} onChange={(e) => set("occupation", e.target.value)} />
        </Field>
        <Field label="Employer">
          <Input value={text("employer")} onChange={(e) => set("employer", e.target.value)} />
        </Field>
      </div>
      <Field label="Street Address">
        <Input value={text("streetAddress")} onChange={(e) => set("streetAddress", e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Suburb">
          <Input value={text("suburb")} onChange={(e) => set("suburb", e.target.value)} />
        </Field>
        <Field label="State">
          <Input value={text("state")} onChange={(e) => set("state", e.target.value)} />
        </Field>
        <Field label="Postcode">
          <Input value={text("postcode")} onChange={(e) => set("postcode", e.target.value)} />
        </Field>
        <Field label="Country">
          <Input value={text("country")} onChange={(e) => set("country", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

type Row = Record<string, any>;

function HealthFields({
  value,
  onChange,
}: {
  value: Row;
  onChange: (v: Row) => void;
}) {
  const set = (k: string, v: unknown) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2.5">
        <Checkbox
          checked={!!value.smoker}
          onCheckedChange={(v) => set("smoker", v === true)}
        />
        <span className="text-sm">Smoker</span>
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Health Status">
          <Select
            value={value.healthStatus ?? ""}
            onValueChange={(v) => set("healthStatus", v)}
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
            value={value.heightCm ?? ""}
            onChange={(e) =>
              set("heightCm", e.target.value ? Number(e.target.value) : null)
            }
          />
        </Field>
        <Field label="Weight (kg)">
          <Input
            type="number"
            value={value.weightKg ?? ""}
            onChange={(e) =>
              set("weightKg", e.target.value ? Number(e.target.value) : null)
            }
          />
        </Field>
      </div>
    </div>
  );
}

function EstateFields({
  value,
  onChange,
}: {
  value: Row;
  onChange: (v: Row) => void;
}) {
  const set = (k: string, v: unknown) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2.5">
        <Checkbox checked={!!value.hasWill} onCheckedChange={(v) => set("hasWill", v === true)} />
        <span className="text-sm">I have a will</span>
      </label>
      {value.hasWill && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Where is it kept?">
            <Input value={value.willLocation ?? ""} onChange={(e) => set("willLocation", e.target.value)} />
          </Field>
          <Field label="Executor">
            <Input value={value.executor ?? ""} onChange={(e) => set("executor", e.target.value)} />
          </Field>
        </div>
      )}
      <label className="flex items-center gap-2.5">
        <Checkbox checked={!!value.hasPoa} onCheckedChange={(v) => set("hasPoa", v === true)} />
        <span className="text-sm">I have a Power of Attorney</span>
      </label>
      {value.hasPoa && (
        <Field label="POA Type">
          <Select value={value.poaType ?? ""} onValueChange={(v) => set("poaType", v)}>
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
          checked={!!value.hasGuardianship}
          onCheckedChange={(v) => set("hasGuardianship", v === true)}
        />
        <span className="text-sm">Guardianship arrangements in place</span>
      </label>
      <Field label="Notes">
        <Textarea rows={2} value={value.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
      </Field>
    </div>
  );
}

function RiskFields({
  value,
  onChange,
}: {
  value: { answers: Record<string, number> };
  onChange: (v: { answers: Record<string, number> }) => void;
}) {
  const answers = value.answers ?? {};
  const pick = (qid: string, weight: number) =>
    onChange({ answers: { ...answers, [qid]: weight } });
  return (
    <div className="space-y-6">
      {RISK_QUESTIONS.map((q, i) => (
        <div key={q.id}>
          <p className="mb-2 text-sm font-medium">
            {i + 1}. {q.text}
          </p>
          <div className="flex flex-col gap-1.5">
            {q.options.map((opt) => {
              const selected = answers[q.id] === opt.weight;
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
    </div>
  );
}

function DependantsFields({
  value,
  onChange,
}: {
  value: Row[];
  onChange: (v: Row[]) => void;
}) {
  const update = (i: number, patch: Row) =>
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([
      ...value,
      { name: "", dateOfBirth: "", relationship: "CHILD", financiallyDependent: true, notes: "" },
    ]);

  return (
    <div className="space-y-3">
      {value.map((r, i) => (
        <div key={i} className="rounded-lg border p-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Name">
              <Input value={r.name ?? ""} onChange={(e) => update(i, { name: e.target.value })} />
            </Field>
            <Field label="Relationship">
              <Select value={r.relationship ?? "CHILD"} onValueChange={(v) => update(i, { relationship: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPENDANT_RELATIONSHIPS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date of Birth">
              <Input type="date" value={r.dateOfBirth ?? ""} onChange={(e) => update(i, { dateOfBirth: e.target.value })} />
            </Field>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5">
              <Checkbox
                checked={!!r.financiallyDependent}
                onCheckedChange={(v) => update(i, { financiallyDependent: v === true })}
              />
              <span className="text-sm">Financially dependent</span>
            </label>
            <Button variant="ghost" size="icon" onClick={() => remove(i)}>
              <Trash2 className="size-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>
        <Plus className="size-4" />
        Add dependant
      </Button>
    </div>
  );
}

function BeneficiariesFields({
  value,
  onChange,
}: {
  value: Row[];
  onChange: (v: Row[]) => void;
}) {
  const update = (i: number, patch: Row) =>
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([
      ...value,
      { name: "", relationship: "OTHER", allocation: null, appliesTo: "WILL" },
    ]);

  return (
    <div className="space-y-3">
      {value.map((r, i) => (
        <div key={i} className="rounded-lg border p-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <Input value={r.name ?? ""} onChange={(e) => update(i, { name: e.target.value })} />
            </Field>
            <Field label="Relationship">
              <Select value={r.relationship ?? "OTHER"} onValueChange={(v) => update(i, { relationship: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BENEFICIARY_RELATIONSHIPS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Applies To">
              <Select value={r.appliesTo ?? "WILL"} onValueChange={(v) => update(i, { appliesTo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BENEFICIARY_APPLIES_TO.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Allocation (%)">
              <Input
                type="number"
                value={r.allocation ?? ""}
                onChange={(e) =>
                  update(i, { allocation: e.target.value ? Number(e.target.value) : null })
                }
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" size="icon" onClick={() => remove(i)}>
              <Trash2 className="size-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>
        <Plus className="size-4" />
        Add beneficiary
      </Button>
    </div>
  );
}
