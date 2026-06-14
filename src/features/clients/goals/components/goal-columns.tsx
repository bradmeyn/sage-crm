import type { ColumnDef } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import type { ClientGoal } from "@/db/schema";
import { GOAL_CATEGORIES, GOAL_PRIORITIES, GOAL_STATUSES } from "../schemas";
import GoalDialog from "./goal-dialog";

const fmt = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ACHIEVED: "bg-blue-100 text-blue-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-orange-100 text-orange-700",
  LOW: "bg-gray-100 text-gray-600",
};

function categoryLabel(v: string) {
  return GOAL_CATEGORIES.find((c) => c.value === v)?.label ?? v;
}
function statusLabel(v: string) {
  return GOAL_STATUSES.find((s) => s.value === v)?.label ?? v;
}
function priorityLabel(v: string) {
  return GOAL_PRIORITIES.find((p) => p.value === v)?.label ?? v;
}

export function buildGoalColumns(
  clientId: string,
  onDelete: (goal: ClientGoal) => void,
): ColumnDef<ClientGoal>[] {
  return [
    {
      id: "category",
      header: "Category",
      accessorKey: "category",
      cell: ({ getValue }) => (
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
          {categoryLabel(String(getValue()))}
        </span>
      ),
    },
    {
      id: "name",
      header: "Goal",
      accessorKey: "name",
    },
    {
      id: "priority",
      header: "Priority",
      accessorKey: "priority",
      cell: ({ getValue }) => {
        const v = String(getValue());
        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${PRIORITY_STYLES[v] ?? "bg-gray-100 text-gray-600"}`}>
            {priorityLabel(v)}
          </span>
        );
      },
    },
    {
      id: "progress",
      header: "Progress",
      accessorFn: (row) => row,
      cell: ({ getValue }) => {
        const goal = getValue() as ClientGoal;
        if (!goal.targetAmount)
          return <span className="text-muted-foreground text-xs">—</span>;
        const pct = Math.min(
          100,
          Math.round((goal.currentAmount / goal.targetAmount) * 100),
        );
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-primary rounded-full h-1.5 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-8 text-right">
              {pct}%
            </span>
          </div>
        );
      },
    },
    {
      id: "targetAmount",
      header: "Target",
      accessorKey: "targetAmount",
      cell: ({ getValue }) => {
        const v = getValue();
        if (v == null)
          return <span className="text-muted-foreground text-xs">—</span>;
        return fmt.format(Number(v));
      },
    },
    {
      id: "targetDate",
      header: "Target Date",
      accessorKey: "targetDate",
      cell: ({ getValue }) => {
        const v = getValue();
        if (!v) return <span className="text-muted-foreground text-xs">—</span>;
        return new Date(String(v)).toLocaleDateString("en-AU", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      },
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: ({ getValue }) => {
        const v = String(getValue());
        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${STATUS_STYLES[v] ?? "bg-gray-100 text-gray-600"}`}>
            {statusLabel(v)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      width: "50px",
      cell: ({ row }) => {
        const goal = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <GoalDialog
                clientId={clientId}
                goal={goal}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Edit
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuItem
                className="text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(goal);
                }}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
