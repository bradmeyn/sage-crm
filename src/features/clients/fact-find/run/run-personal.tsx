import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GENDERS,
  MARITAL_STATUSES,
  RESIDENCY_STATUSES,
  AU_STATES,
} from "@/features/clients/schemas";
import { useUpdatePersonal } from "../hooks";
import { useAutosave, saveStatusText } from "../use-autosave";
import { Field } from "./field";

type Values = Record<string, string>;

type PersonalClient = {
  title: string | null;
  middleName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  maritalStatus: string | null;
  residencyStatus: string | null;
  email: string | null;
  phone: string | null;
  streetAddress: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  country: string | null;
  occupation: string | null;
  employer: string | null;
};

const today = new Date().toISOString().slice(0, 10);

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select…" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function RunPersonal({
  clientId,
  client,
}: {
  clientId: string;
  client: PersonalClient;
}) {
  const update = useUpdatePersonal();
  const { status, schedule } = useAutosave<Values>((v) =>
    update.mutateAsync({ ...v, clientId }),
  );
  const [values, setValues] = useState<Values>(() => ({
    title: client.title ?? "",
    middleName: client.middleName ?? "",
    dateOfBirth: client.dateOfBirth ?? "",
    gender: client.gender ?? "",
    maritalStatus: client.maritalStatus ?? "",
    residencyStatus: client.residencyStatus ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    streetAddress: client.streetAddress ?? "",
    suburb: client.suburb ?? "",
    state: client.state ?? "",
    postcode: client.postcode ?? "",
    country: client.country ?? "",
    occupation: client.occupation ?? "",
    employer: client.employer ?? "",
  }));

  const set = (k: string, v: string) => {
    const next = { ...values, [k]: v };
    setValues(next);
    schedule(next);
  };
  const t = (k: string) => values[k] ?? "";

  return (
    <div className="space-y-5">
      <div className="flex justify-end text-xs text-muted-foreground">
        {saveStatusText[status]}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title">
          <Input value={t("title")} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Middle Name">
          <Input value={t("middleName")} onChange={(e) => set("middleName", e.target.value)} />
        </Field>
        <Field label="Date of Birth">
          <Input type="date" max={today} value={t("dateOfBirth")} onChange={(e) => set("dateOfBirth", e.target.value)} />
        </Field>
        <Field label="Gender">
          <SelectField value={t("gender")} onChange={(v) => set("gender", v)} options={GENDERS} />
        </Field>
        <Field label="Marital Status">
          <SelectField value={t("maritalStatus")} onChange={(v) => set("maritalStatus", v)} options={MARITAL_STATUSES} />
        </Field>
        <Field label="Residency (tax)">
          <SelectField value={t("residencyStatus")} onChange={(v) => set("residencyStatus", v)} options={RESIDENCY_STATUSES} />
        </Field>
        <Field label="Email">
          <Input value={t("email")} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={t("phone")} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Occupation">
          <Input value={t("occupation")} onChange={(e) => set("occupation", e.target.value)} />
        </Field>
        <Field label="Employer">
          <Input value={t("employer")} onChange={(e) => set("employer", e.target.value)} />
        </Field>
      </div>
      <Field label="Street Address">
        <Input value={t("streetAddress")} onChange={(e) => set("streetAddress", e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Suburb">
          <Input value={t("suburb")} onChange={(e) => set("suburb", e.target.value)} />
        </Field>
        <Field label="State">
          <SelectField value={t("state")} onChange={(v) => set("state", v)} options={AU_STATES} />
        </Field>
        <Field label="Postcode">
          <Input
            inputMode="numeric"
            maxLength={4}
            value={t("postcode")}
            onChange={(e) => set("postcode", e.target.value.replace(/\D/g, ""))}
          />
        </Field>
        <Field label="Country">
          <Input value={t("country")} onChange={(e) => set("country", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}
