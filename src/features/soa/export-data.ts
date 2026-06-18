import {
  insuranceCoverTypeLabel,
  insuranceOwnershipLabel,
  contributionTypeLabel,
  frequencyLabel,
} from "./schemas";

// Shape passed to both the PDF and Word document builders. Assembled
// server-side in exportSoa from the SOA + recommendations + fact-find context.
export type SoaExportData = {
  title: string;
  status: string;
  clientName: string;
  riskCategory: string | null;
  scope: string | null;
  intro: string | null;
  goalNames: string[];
  recommendations: {
    category: string;
    type: string;
    title: string;
    wording: string | null;
    benefits: string[];
    warnings: string[];
    data: Record<string, any>;
    goalNames: string[];
  }[];
};

const aud = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

const money = (v: unknown) =>
  typeof v === "number" && !Number.isNaN(v) ? aud.format(v) : null;

/**
 * Flatten a recommendation's type-specific `data` into readable label/value
 * lines for the export documents. Mirrors the inputs in typed-fields.tsx.
 */
export function recommendationDataLines(
  type: string,
  data: Record<string, any>,
): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  const push = (label: string, value: string | null) => {
    if (value) out.push({ label, value });
  };
  // Resolve a label only when the raw field has a value (helpers return "—").
  const lbl = (fn: (v?: string | null) => string, raw: unknown) =>
    raw ? fn(raw as string) : null;

  if (type === "INSURANCE") {
    push("Cover type", lbl(insuranceCoverTypeLabel, data.coverType));
    push("Ownership", lbl(insuranceOwnershipLabel, data.ownership));
    push("Cover amount", money(data.coverAmount));
    push("Premium", money(data.premium));
    push("Premium frequency", lbl(frequencyLabel, data.premiumFrequency));
  } else if (type === "SUPER_CONTRIBUTION") {
    push("Contribution type", lbl(contributionTypeLabel, data.contributionType));
    push("Amount", money(data.amount));
    push("Frequency", lbl(frequencyLabel, data.frequency));
  } else if (type === "INVESTMENT_SWITCH") {
    push("Switch from", data.fromOption || null);
    push("Switch to", data.toOption || null);
    push("Amount", money(data.amount));
  }

  return out;
}
