import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link } from "@tanstack/react-router";
import JobMemberStack from "./job-member-stack";
import type {
  Job,
  JobTask,
  Client,
  JobClient,
  JobMember,
  User,
} from "@/db/schema";

type JobWithTasksAndClients = Job & {
  tasks: JobTask[];
  clients: (JobClient & { client: Client })[];
  members: (JobMember & { user: User })[];
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-orange-100 text-orange-700",
  LOW: "bg-gray-100 text-gray-600",
};

export default function JobCard({ job }: { job: JobWithTasksAndClients }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: job.id,
    data: { jobId: job.id, stage: job.currentStage },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const completedTasks = job.tasks.filter((t) => t.isCompleted).length;
  const totalTasks = job.tasks.length;
  const progressPct =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const isOverdue =
    job.dueDate &&
    job.status !== "COMPLETED" &&
    new Date(job.dueDate) < new Date();

  const firstClient = job.clients[0]?.client;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow">
      {/* Client name + member avatars */}
      <div className="flex items-center justify-between gap-1 mb-1">
        {firstClient ? (
          <Link
            to="/clients/$clientId"
            params={{ clientId: firstClient.id }}
            className="text-xs text-muted-foreground hover:text-primary transition-colors truncate"
            onClick={(e) => e.stopPropagation()}>
            {firstClient.firstName} {firstClient.lastName}
            {job.clients.length > 1 && ` +${job.clients.length - 1}`}
          </Link>
        ) : (
          <span />
        )}
        {job.members.length > 0 && (
          <div onClick={(e) => e.stopPropagation()}>
            <JobMemberStack members={job.members} jobId={job.id} size="sm" />
          </div>
        )}
      </div>

      {/* Job title */}
      <Link
        to="/jobs/$jobId"
        params={{ jobId: job.id }}
        className="block font-semibold text-sm mb-2 truncate hover:text-primary transition-colors"
        onClick={(e) => e.stopPropagation()}>
        {job.title}
      </Link>

      <div className="flex items-center justify-between gap-2">
        {/* Due date */}
        {job.dueDate ? (
          <span
            className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
            {new Date(job.dueDate).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "short",
            })}
          </span>
        ) : (
          <span />
        )}

        {/* Priority badge */}
        <span
          className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_STYLES[job.priority] ?? "bg-gray-100 text-gray-600"}`}>
          {job.priority}
        </span>
      </div>

      {/* Task progress */}
      {totalTasks > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">
              {completedTasks}/{totalTasks} tasks
            </span>
            <span className="text-xs text-muted-foreground">
              {progressPct}%
            </span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
