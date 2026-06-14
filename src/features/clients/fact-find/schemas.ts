export const DEPENDANT_RELATIONSHIPS = [
  { value: "CHILD", label: "Child" },
  { value: "STEPCHILD", label: "Stepchild" },
  { value: "PARENT", label: "Parent" },
  { value: "SIBLING", label: "Sibling" },
  { value: "OTHER", label: "Other" },
] as const;

export const POA_TYPES = [
  { value: "FINANCIAL", label: "Financial" },
  { value: "MEDICAL", label: "Medical" },
  { value: "BOTH", label: "Both" },
] as const;

export const BENEFICIARY_RELATIONSHIPS = [
  { value: "SPOUSE", label: "Spouse" },
  { value: "CHILD", label: "Child" },
  { value: "FAMILY", label: "Family" },
  { value: "CHARITY", label: "Charity" },
  { value: "ESTATE", label: "Estate" },
  { value: "OTHER", label: "Other" },
] as const;

export const BENEFICIARY_APPLIES_TO = [
  { value: "WILL", label: "Will" },
  { value: "SUPER", label: "Superannuation" },
  { value: "INSURANCE", label: "Insurance" },
] as const;

// ─── Risk profile ─────────────────────────────────────────────────────────────

export const RISK_CATEGORIES = [
  { value: "CONSERVATIVE", label: "Conservative" },
  { value: "MODERATELY_CONSERVATIVE", label: "Moderately Conservative" },
  { value: "BALANCED", label: "Balanced" },
  { value: "GROWTH", label: "Growth" },
  { value: "HIGH_GROWTH", label: "High Growth" },
] as const;

// Each option carries a weight 1 (most conservative) … 5 (most aggressive).
export const RISK_QUESTIONS = [
  {
    id: "timeframe",
    text: "How long until you expect to draw on these investments?",
    options: [
      { label: "Within 2 years", weight: 1 },
      { label: "2–5 years", weight: 2 },
      { label: "5–10 years", weight: 3 },
      { label: "10–15 years", weight: 4 },
      { label: "More than 15 years", weight: 5 },
    ],
  },
  {
    id: "goal",
    text: "What matters most to you?",
    options: [
      { label: "Protecting my capital above all", weight: 1 },
      { label: "Mostly safety, a little growth", weight: 2 },
      { label: "A balance of safety and growth", weight: 3 },
      { label: "Mostly growth, accepting some risk", weight: 4 },
      { label: "Maximising long-term growth", weight: 5 },
    ],
  },
  {
    id: "reaction",
    text: "If your portfolio fell 20% in a year, you would:",
    options: [
      { label: "Sell everything to stop further loss", weight: 1 },
      { label: "Sell some investments", weight: 2 },
      { label: "Do nothing and wait", weight: 3 },
      { label: "Hold, and stay the course", weight: 4 },
      { label: "Invest more while prices are low", weight: 5 },
    ],
  },
  {
    id: "experience",
    text: "How would you describe your investment experience?",
    options: [
      { label: "None", weight: 1 },
      { label: "Limited (cash, term deposits)", weight: 2 },
      { label: "Some (managed funds, super)", weight: 3 },
      { label: "Good (shares, property)", weight: 4 },
      { label: "Extensive (active investor)", weight: 5 },
    ],
  },
  {
    id: "volatility",
    text: "Which portfolio would you prefer?",
    options: [
      { label: "+4% best / -1% worst year", weight: 1 },
      { label: "+9% best / -4% worst year", weight: 2 },
      { label: "+14% best / -8% worst year", weight: 3 },
      { label: "+20% best / -13% worst year", weight: 4 },
      { label: "+28% best / -20% worst year", weight: 5 },
    ],
  },
  {
    id: "income",
    text: "How secure and stable is your income?",
    options: [
      { label: "Very insecure", weight: 1 },
      { label: "Somewhat insecure", weight: 2 },
      { label: "Stable", weight: 3 },
      { label: "Secure", weight: 4 },
      { label: "Very secure with surplus", weight: 5 },
    ],
  },
] as const;

/** Average the answered weights → a risk category. Null until any answered. */
export function computeRiskCategory(
  answers: Record<string, number> | null | undefined,
): string | null {
  const values = Object.values(answers ?? {}).filter(
    (v) => typeof v === "number",
  );
  if (values.length === 0) return null;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  if (avg < 1.8) return "CONSERVATIVE";
  if (avg < 2.6) return "MODERATELY_CONSERVATIVE";
  if (avg < 3.4) return "BALANCED";
  if (avg < 4.2) return "GROWTH";
  return "HIGH_GROWTH";
}

export const riskCategoryLabel = (v?: string | null) =>
  RISK_CATEGORIES.find((c) => c.value === v)?.label ?? v ?? "—";

export const HEALTH_STATUSES = [
  { value: "EXCELLENT", label: "Excellent" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
] as const;

const labelOf = (
  opts: ReadonlyArray<{ value: string; label: string }>,
  value: string | null | undefined,
) => opts.find((o) => o.value === value)?.label ?? value ?? "—";

export const dependantRelationshipLabel = (v?: string | null) =>
  labelOf(DEPENDANT_RELATIONSHIPS, v);
export const beneficiaryRelationshipLabel = (v?: string | null) =>
  labelOf(BENEFICIARY_RELATIONSHIPS, v);
export const beneficiaryAppliesToLabel = (v?: string | null) =>
  labelOf(BENEFICIARY_APPLIES_TO, v);
export const healthStatusLabel = (v?: string | null) =>
  labelOf(HEALTH_STATUSES, v);
