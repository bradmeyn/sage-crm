export const STRATEGY_CATEGORIES = [
  { value: "SUPERANNUATION", label: "Superannuation" },
  { value: "CONTRIBUTIONS", label: "Contributions" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "INVESTMENT", label: "Investment" },
  { value: "RETIREMENT", label: "Retirement" },
  { value: "CASHFLOW", label: "Cashflow" },
  { value: "DEBT", label: "Debt" },
  { value: "ESTATE", label: "Estate" },
  { value: "OTHER", label: "Other" },
] as const;

// Recommendation types drive which structured fields appear.
export const STRATEGY_TYPES = [
  { value: "GENERIC", label: "General" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "SUPER_CONTRIBUTION", label: "Super contribution" },
  { value: "INVESTMENT_SWITCH", label: "Investment switch" },
] as const;

const labelFrom =
  (opts: ReadonlyArray<{ value: string; label: string }>) =>
  (v?: string | null) =>
    opts.find((o) => o.value === v)?.label ?? v ?? "—";

export const strategyCategoryLabel = (v?: string | null) =>
  STRATEGY_CATEGORIES.find((c) => c.value === v)?.label ?? v ?? "Other";
export const strategyTypeLabel = labelFrom(STRATEGY_TYPES);

// ─── Structured field options (per recommendation type) ──────────────────────

export const INSURANCE_COVER_TYPES = [
  { value: "LIFE", label: "Life" },
  { value: "TPD", label: "TPD" },
  { value: "TRAUMA", label: "Trauma" },
  { value: "INCOME_PROTECTION", label: "Income Protection" },
] as const;

export const INSURANCE_OWNERSHIP = [
  { value: "INSIDE_SUPER", label: "Inside super" },
  { value: "OUTSIDE_SUPER", label: "Outside super" },
  { value: "SELF_OWNED", label: "Self-owned" },
] as const;

export const CONTRIBUTION_TYPES = [
  { value: "CONCESSIONAL_SS", label: "Concessional (salary sacrifice)" },
  { value: "CONCESSIONAL_PERSONAL", label: "Concessional (personal deductible)" },
  { value: "NON_CONCESSIONAL", label: "Non-concessional" },
  { value: "SPOUSE", label: "Spouse contribution" },
  { value: "CO_CONTRIBUTION", label: "Government co-contribution" },
] as const;

export const FREQUENCIES = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "FORTNIGHTLY", label: "Fortnightly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "ANNUALLY", label: "Annually" },
] as const;

export const insuranceCoverTypeLabel = labelFrom(INSURANCE_COVER_TYPES);
export const insuranceOwnershipLabel = labelFrom(INSURANCE_OWNERSHIP);
export const contributionTypeLabel = labelFrom(CONTRIBUTION_TYPES);
export const frequencyLabel = labelFrom(FREQUENCIES);

export type SystemStrategy = {
  name: string;
  category: string;
  type: string;
  wording: string;
  benefits: string[];
  warnings: string[];
};

// Seeded once per org (lazy), then editable/extendable by the practice.
export const SYSTEM_STRATEGIES: SystemStrategy[] = [
  {
    name: "Consolidate superannuation funds",
    category: "SUPERANNUATION",
    type: "GENERIC",
    wording:
      "We recommend you consolidate your superannuation into a single fund. This simplifies the administration of your retirement savings and reduces duplicate fees and insurance premiums.",
    benefits: [
      "Reduced overall fees by removing duplicate accounts",
      "Easier to manage and track a single balance",
      "A single investment strategy aligned to your goals",
    ],
    warnings: [
      "You may lose insurance cover held in the fund being closed",
      "Possible exit fees or capital gains on sale of assets",
      "Check for any lost-benefit or employer-tied arrangements",
    ],
  },
  {
    name: "Salary sacrifice (concessional contributions)",
    category: "CONTRIBUTIONS",
    type: "SUPER_CONTRIBUTION",
    wording:
      "We recommend you make additional concessional contributions to superannuation via salary sacrifice. These contributions are taxed at 15% rather than your marginal tax rate, boosting your retirement savings tax-effectively.",
    benefits: [
      "Contributions taxed at 15% instead of your marginal rate",
      "Increases your retirement savings",
      "Reduces your assessable income",
    ],
    warnings: [
      "Contributions count toward the concessional cap",
      "Super is preserved until you meet a condition of release",
      "Excess contributions may incur additional tax",
    ],
  },
  {
    name: "Non-concessional contributions",
    category: "CONTRIBUTIONS",
    type: "SUPER_CONTRIBUTION",
    wording:
      "We recommend you make non-concessional (after-tax) contributions to superannuation to grow your retirement savings within the concessionally taxed super environment.",
    benefits: [
      "Earnings taxed concessionally within super",
      "Boosts your retirement balance",
      "May enable a future re-contribution strategy",
    ],
    warnings: [
      "Counts toward the non-concessional cap",
      "Preserved until a condition of release is met",
    ],
  },
  {
    name: "Government co-contribution",
    category: "CONTRIBUTIONS",
    type: "SUPER_CONTRIBUTION",
    wording:
      "As your income is within the eligible thresholds, we recommend you make a personal after-tax contribution to receive the government co-contribution.",
    benefits: [
      "Receive up to $500 from the government",
      "An effective return on the contribution made",
    ],
    warnings: [
      "Eligibility depends on income and work tests",
      "Contribution is preserved within super",
    ],
  },
  {
    name: "Align investment option to risk profile",
    category: "INVESTMENT",
    type: "INVESTMENT_SWITCH",
    wording:
      "We recommend you switch your investment option to one that aligns with your assessed risk profile, ensuring your portfolio's expected risk and return match your objectives.",
    benefits: [
      "Portfolio aligned to your risk tolerance",
      "Appropriate diversification",
      "Clear expectations of volatility and return",
    ],
    warnings: [
      "Switching may realise capital gains",
      "Past performance is not a guide to future returns",
      "Markets fluctuate and capital is at risk",
    ],
  },
  {
    name: "Commence an account-based pension",
    category: "RETIREMENT",
    type: "GENERIC",
    wording:
      "We recommend you commence an account-based pension with your superannuation to provide a tax-effective, regular income stream in retirement.",
    benefits: [
      "Tax-free investment earnings in pension phase",
      "Regular, flexible income payments",
      "Tax-free payments once aged 60 or over",
    ],
    warnings: [
      "Minimum drawdown rules apply",
      "Balance may deplete depending on drawdowns and returns",
      "Transfer balance cap limits apply",
    ],
  },
  {
    name: "Establish life and TPD insurance",
    category: "INSURANCE",
    type: "INSURANCE",
    wording:
      "We recommend you establish Life and Total & Permanent Disability cover to protect you and your family against death or permanent disability.",
    benefits: [
      "Financial security for your dependants",
      "Lump sum to clear debts and provide income",
      "Premiums may be funded through superannuation",
    ],
    warnings: [
      "Premiums increase with age",
      "Cover may be stepped or level — costs differ over time",
      "Claims are subject to policy terms and disclosure",
    ],
  },
  {
    name: "Establish income protection",
    category: "INSURANCE",
    type: "INSURANCE",
    wording:
      "We recommend you establish income protection cover to replace a portion of your income if you are unable to work due to illness or injury.",
    benefits: [
      "Replaces up to 70% of your income",
      "Helps meet living costs while unable to work",
      "Premiums are generally tax-deductible",
    ],
    warnings: [
      "Waiting and benefit periods apply",
      "Benefits may be offset by other income",
      "Premiums increase with age",
    ],
  },
  {
    name: "Establish an emergency cash reserve",
    category: "CASHFLOW",
    type: "GENERIC",
    wording:
      "We recommend you build and maintain an emergency cash reserve equal to 3–6 months of expenses to provide a buffer against unexpected events.",
    benefits: [
      "Buffer against unexpected expenses or income loss",
      "Avoids the need to sell investments at a bad time",
      "Peace of mind and financial resilience",
    ],
    warnings: ["Cash returns may not keep pace with inflation"],
  },
  {
    name: "Pay down non-deductible debt",
    category: "DEBT",
    type: "GENERIC",
    wording:
      "We recommend you prioritise paying down non-deductible debt (such as your home loan and credit cards), as the effective return from doing so is your after-tax interest rate.",
    benefits: [
      "Guaranteed return equal to the interest saved",
      "Reduces financial risk and interest cost",
      "Frees up future cashflow",
    ],
    warnings: ["Funds used are not available for other investments"],
  },
  {
    name: "Debt recycling",
    category: "DEBT",
    type: "GENERIC",
    wording:
      "We recommend a debt recycling strategy, progressively converting non-deductible home loan debt into deductible investment debt to improve tax efficiency and build wealth.",
    benefits: [
      "Converts non-deductible debt to deductible debt",
      "Builds an investment portfolio over time",
      "Potential tax deductions on investment interest",
    ],
    warnings: [
      "Increases investment risk through gearing",
      "Investment values can fall, magnifying losses",
      "Requires discipline and stable cashflow",
    ],
  },
  {
    name: "Review estate planning and beneficiary nominations",
    category: "ESTATE",
    type: "GENERIC",
    wording:
      "We recommend you review your estate planning, including your will and superannuation death benefit nominations, to ensure your wishes are carried out.",
    benefits: [
      "Ensures assets pass according to your wishes",
      "Binding nominations provide certainty",
      "Reduces the risk of disputes and delays",
    ],
    warnings: [
      "Estate documents should be prepared by a qualified professional",
      "Nominations must be kept current",
    ],
  },
];
