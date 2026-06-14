import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  INSURANCE_COVER_TYPES,
  INSURANCE_OWNERSHIP,
  CONTRIBUTION_TYPES,
  FREQUENCIES,
} from "../schemas";

type Data = Record<string, any>;

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Dropdown({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
}) {
  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? "Select…"} />
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

/** Structured inputs for the 'involved' recommendation types. */
export default function TypedFields({
  type,
  data,
  onChange,
}: {
  type: string;
  data: Data;
  onChange: (next: Data) => void;
}) {
  const set = (k: string, v: unknown) => onChange({ ...data, [k]: v });
  const num = (k: string) => (data[k] ?? "") as string | number;

  if (type === "INSURANCE") {
    return (
      <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2">
        <F label="Cover type">
          <Dropdown
            value={data.coverType ?? ""}
            onChange={(v) => set("coverType", v)}
            options={INSURANCE_COVER_TYPES}
          />
        </F>
        <F label="Ownership">
          <Dropdown
            value={data.ownership ?? ""}
            onChange={(v) => set("ownership", v)}
            options={INSURANCE_OWNERSHIP}
          />
        </F>
        <F label="Cover amount ($)">
          <Input
            type="number"
            value={num("coverAmount")}
            onChange={(e) =>
              set("coverAmount", e.target.value ? Number(e.target.value) : null)
            }
          />
        </F>
        <F label="Premium ($)">
          <Input
            type="number"
            value={num("premium")}
            onChange={(e) =>
              set("premium", e.target.value ? Number(e.target.value) : null)
            }
          />
        </F>
        <F label="Premium frequency">
          <Dropdown
            value={data.premiumFrequency ?? ""}
            onChange={(v) => set("premiumFrequency", v)}
            options={FREQUENCIES}
          />
        </F>
      </div>
    );
  }

  if (type === "SUPER_CONTRIBUTION") {
    return (
      <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2">
        <F label="Contribution type">
          <Dropdown
            value={data.contributionType ?? ""}
            onChange={(v) => set("contributionType", v)}
            options={CONTRIBUTION_TYPES}
          />
        </F>
        <F label="Amount ($)">
          <Input
            type="number"
            value={num("amount")}
            onChange={(e) =>
              set("amount", e.target.value ? Number(e.target.value) : null)
            }
          />
        </F>
        <F label="Frequency">
          <Dropdown
            value={data.frequency ?? ""}
            onChange={(v) => set("frequency", v)}
            options={FREQUENCIES}
          />
        </F>
      </div>
    );
  }

  if (type === "INVESTMENT_SWITCH") {
    return (
      <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2">
        <F label="Switch from">
          <Input
            value={data.fromOption ?? ""}
            onChange={(e) => set("fromOption", e.target.value)}
          />
        </F>
        <F label="Switch to">
          <Input
            value={data.toOption ?? ""}
            onChange={(e) => set("toOption", e.target.value)}
          />
        </F>
        <F label="Amount ($)">
          <Input
            type="number"
            value={num("amount")}
            onChange={(e) =>
              set("amount", e.target.value ? Number(e.target.value) : null)
            }
          />
        </F>
      </div>
    );
  }

  return null;
}
