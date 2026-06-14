import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useUpdatePersonal } from "../hooks";
import { useAutosave, saveStatusText } from "../use-autosave";
import { Field } from "./field";

type Values = Record<string, string>;

type PersonalClient = {
  title: string | null;
  dateOfBirth: string | null;
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
    dateOfBirth: client.dateOfBirth ?? "",
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
        <Field label="Date of Birth">
          <Input type="date" value={t("dateOfBirth")} onChange={(e) => set("dateOfBirth", e.target.value)} />
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
          <Input value={t("state")} onChange={(e) => set("state", e.target.value)} />
        </Field>
        <Field label="Postcode">
          <Input value={t("postcode")} onChange={(e) => set("postcode", e.target.value)} />
        </Field>
        <Field label="Country">
          <Input value={t("country")} onChange={(e) => set("country", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}
