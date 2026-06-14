import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useFactFind, factFindKeys } from "../hooks";
import SectionDependants from "../components/section-dependants";
import SectionBeneficiaries from "../components/section-beneficiaries";
import RunPersonal from "./run-personal";
import RunEstate from "./run-estate";
import RunHealth from "./run-health";
import RunRiskProfile from "./run-risk-profile";
import {
  RunAssets,
  RunLiabilities,
  RunIncome,
  RunExpenses,
  RunGoals,
  RunInsurance,
} from "./run-financials";

type Status = "complete" | "partial" | "empty";

function StatusDot({ status }: { status: Status }) {
  const cls =
    status === "complete"
      ? "bg-primary"
      : status === "partial"
        ? "bg-amber-500"
        : "border border-muted-foreground/40";
  return <span className={`size-2.5 rounded-full shrink-0 ${cls}`} />;
}

// Fixed section order, matching the aggregator's `sections` array, so a
// deep-linked `?section=` maps to the right starting index without effects.
const SECTION_ORDER = [
  "personal",
  "dependants",
  "assets",
  "liabilities",
  "income",
  "expenses",
  "goals",
  "insurance",
  "estate",
  "beneficiaries",
  "health",
  "risk",
];

export default function RunFactFind({
  clientId,
  initialSection,
}: {
  clientId: string;
  initialSection?: string;
}) {
  const { data, isLoading } = useFactFind(clientId);
  const queryClient = useQueryClient();
  const [active, setActive] = useState(() => {
    const i = SECTION_ORDER.indexOf(initialSection ?? "");
    return i >= 0 ? i : 0;
  });

  // Refresh the aggregator on navigation so the rail's status/completeness
  // reflects edits made via section-owned queries (e.g. financial dialogs).
  const go = (next: number) => {
    queryClient.invalidateQueries({ queryKey: factFindKeys.detail(clientId) });
    setActive(next);
  };

  if (isLoading || !data) {
    return <p className="p-8 text-sm text-muted-foreground">Loading…</p>;
  }

  const { sections, completeness, client } = data;
  const current = sections[active];
  const name = `${client.firstName} ${client.lastName}`;

  const body = () => {
    switch (current.key) {
      case "personal":
        return <RunPersonal clientId={clientId} client={client} />;
      case "dependants":
        return <SectionDependants clientId={clientId} dependants={data.dependants} />;
      case "estate":
        return <RunEstate clientId={clientId} estate={data.estate} />;
      case "beneficiaries":
        return <SectionBeneficiaries clientId={clientId} beneficiaries={data.beneficiaries} />;
      case "health":
        return <RunHealth clientId={clientId} health={data.health} />;
      case "assets":
        return <RunAssets clientId={clientId} />;
      case "liabilities":
        return <RunLiabilities clientId={clientId} />;
      case "income":
        return <RunIncome clientId={clientId} />;
      case "expenses":
        return <RunExpenses clientId={clientId} />;
      case "goals":
        return <RunGoals clientId={clientId} />;
      case "insurance":
        return <RunInsurance clientId={clientId} />;
      case "risk":
        return <RunRiskProfile clientId={clientId} riskProfile={data.riskProfile} />;
      default:
        return null;
    }
  };

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Fact Find
          </p>
          <h1 className="heading-primary">{name}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block w-40">
            <p className="mb-1 text-right text-xs text-muted-foreground">
              {completeness}% complete
            </p>
            <Progress value={completeness} className="h-1.5" />
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/clients/$clientId/fact-find" params={{ clientId }}>
              <X className="size-4" />
              Exit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        {/* Rail */}
        <nav className="flex flex-col gap-0.5 h-fit">
          {sections.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => go(i)}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                i === active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <StatusDot status={s.status} />
              {s.label}
            </button>
          ))}
        </nav>

        {/* Active section */}
        <div>
          <Card className="p-8">
            <h2 className="heading-secondary mb-6">{current.label}</h2>
            {body()}
          </Card>

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => go(Math.max(0, active - 1))}
              disabled={active === 0}
            >
              <ChevronLeft className="size-4" />
              Back
            </Button>
            {active < sections.length - 1 ? (
              <Button onClick={() => go(active + 1)}>
                Next
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button asChild>
                <Link to="/clients/$clientId/fact-find" params={{ clientId }}>
                  Done
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
