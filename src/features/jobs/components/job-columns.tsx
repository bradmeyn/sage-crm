import type { ColumnDef } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Job, JobTask, Client, JobClient } from "@/db/schema";
import {
  JOB_STAGES,
  JOB_TYPES,
  JOB_STATUSES,
  JOB_PRIORITIES,
  jobProgress,
} from "../schemas";
import type { JobTypeValue } from "../schemas";
import EditJobDialog from "./edit-job-dialog";

type JobWithTasks = Job & {
  tasks: JobTask[];
  clients: (JobClient & { client: Client })[];
};
type JobWithTasksAndClients = JobWithTasks;

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-orange-100 text-orange-700",
  LOW: "bg-gray-100 text-gray-600",
};

function typeLabel(v: string) {
  return JOB_TYPES.find((t) => t.value === v)?.label ?? v;
}

function stageLabel(jobType: string, stageValue: string) {
  return (
    JOB_STAGES[jobType as JobTypeValue]?.find((s) => s.value === stageValue)
      ?.label ?? stageValue
  );
}

function statusLabel(v: string) {
  return JOB_STATUSES.find((s) => s.value === v)?.label ?? v;
}

function priorityLabel(v: string) {
  return JOB_PRIORITIES.find((p) => p.value === v)?.label ?? v;
}

// Shared columns (no client column)
function sharedColumns<T extends JobWithTasksAndClients>(
  onDelete: (job: T) => void,
  showClient = false,
): ColumnDef<T>[] {
  const cols: ColumnDef<T>[] = [];

  if (showClient) {
    cols.push({
      id: "client",
      header: "Client",
      accessorFn: (row) => row,
      cell: ({ getValue }) => {
        const j = getValue() as JobWithTasksAndClients;
        if (!j.clients?.length)
          return <span className="text-muted-foreground text-xs">—</span>;
        const names = j.clients
          .map((jc) => `${jc.client.firstName} ${jc.client.lastName}`)
          .join(" & ");
        return (
          <Link
            to="/clients/$clientId"
            params={{ clientId: j.clients[0].client.id }}
            className="text-primary hover:underline font-medium"
            onClick={(e) => e.stopPropagation()}>
            {names}
          </Link>
        );
      },
    });
  }

  cols.push(
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
    },
    {
      id: "jobType",
      header: "Type",
      accessorKey: "jobType",
      cell: ({ getValue }) => (
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
          {typeLabel(String(getValue()))}
        </span>
      ),
    },
    {
      id: "currentStage",
      header: "Stage",
      accessorFn: (row) => row,
      cell: ({ getValue }) => {
        const j = getValue() as Job;
        return (
          <span className="text-sm text-muted-foreground">
            {stageLabel(j.jobType, j.currentStage)}
          </span>
        );
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
        const j = getValue() as JobWithTasks;
        const pct = jobProgress(j.tasks);
        const done = j.tasks.filter((t) => t.isCompleted).length;
        return (
          <div className="flex items-center gap-2 min-w-[100px]">
            <div className="flex-1 bg-muted rounded-full h-1.5">
              <div
                className="bg-primary rounded-full h-1.5 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-14 text-right">
              {done}/{j.tasks.length}
            </span>
          </div>
        );
      },
    },
    {
      id: "dueDate",
      header: "Due Date",
      accessorKey: "dueDate",
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
      id: "actions",
      header: "",
      width: "50px",
      cell: ({ row }) => {
        const j = row.original;
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
              <EditJobDialog
                job={j}
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
                  onDelete(j);
                }}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  );

  return cols;
}

/** Columns for global jobs list (includes client column) */
export function buildJobColumns(
  onDelete: (job: JobWithTasksAndClients) => void,
): ColumnDef<JobWithTasksAndClients>[] {
  return sharedColumns<JobWithTasksAndClients>(onDelete, true);
}

/** Columns for client jobs tab (no client column) */
export function buildClientJobColumns(
  onDelete: (job: JobWithTasks) => void,
): ColumnDef<JobWithTasks>[] {
  return sharedColumns<JobWithTasks>(onDelete, false);
}
