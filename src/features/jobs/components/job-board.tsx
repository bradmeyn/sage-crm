import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  type DragEndEvent,
  type DragStartEvent,
  type CollisionDetection,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { jobKeys, useUpdateJobStage } from "@/features/jobs/hooks";
import { useTemplates } from "@/features/jobs/templates/hooks";
import { ACTIVE_JOB_SLUGS } from "@/features/jobs/schemas";
import JobCard from "./job-card";
import { Badge } from "@/components/ui/badge";
import type {
  Job,
  JobTask,
  Client,
  JobClient,
  JobMember,
  User,
  JobTemplate,
} from "@/db/schema";

// Prefer column droppables (pointer within), fall back to rect intersection for card targets
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return rectIntersection(args);
};

type JobWithTasksAndClients = Job & {
  tasks: JobTask[];
  clients: (JobClient & { client: Client })[];
  members: (JobMember & { user: User })[];
};

type JobBoardProps = {
  jobs: JobWithTasksAndClients[];
  defaultType?: string;
};

function KanbanColumn({
  stage,
  jobs,
}: {
  stage: { value: string; label: string };
  jobs: JobWithTasksAndClients[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.value });

  return (
    <div
      className={`flex flex-col min-w-[280px] max-w-[280px] rounded-lg border bg-muted/30 transition-colors ${isOver ? "border-primary/50 bg-primary/5" : ""}`}>
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b">
        <span className="text-sm font-semibold">{stage.label}</span>
        <Badge variant="secondary">{jobs.length}</Badge>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 min-h-[120px] overflow-y-auto max-h-[calc(100vh-260px)]">
        <SortableContext
          items={jobs.map((j) => j.id)}
          strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function JobBoard({ jobs, defaultType }: JobBoardProps) {
  const [activeJob, setActiveJob] = useState<JobWithTasksAndClients | null>(
    null,
  );
  const search = useSearch({ strict: false }) as {
    view?: string;
    type?: string;
  };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateJobStage = useUpdateJobStage();
  const { data: templates } = useTemplates();

  const visibleTemplates = templates.filter((t) =>
    ACTIVE_JOB_SLUGS.includes(t.slug as (typeof ACTIVE_JOB_SLUGS)[number]),
  );

  const activeTemplateId =
    search.type ?? defaultType ?? visibleTemplates[0]?.id ?? "";

  const activeTemplate: JobTemplate | undefined = visibleTemplates.find(
    (t) => t.id === activeTemplateId,
  );
  const stages = activeTemplate?.stages ?? [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Match jobs to template via templateId (preferred) or slug fallback for legacy jobs
  const jobsForTemplate = jobs.filter(
    (j) =>
      j.templateId === activeTemplateId ||
      (!j.templateId && activeTemplate && j.jobType === activeTemplate.slug),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const job = jobsForTemplate.find((j) => j.id === event.active.id);
    setActiveJob(job ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveJob(null);
    const { active, over } = event;
    if (!over) return;

    const jobId = active.id as string;
    const overId = over.id as string;

    // over.id is either a stage value (column droppable) or a job id (card)
    const stageValues = new Set(stages.map((s) => s.value));
    const targetStage = stageValues.has(overId)
      ? overId
      : (jobsForTemplate.find((j) => j.id === overId)?.currentStage ?? null);

    if (!targetStage) return;

    const draggedJob = jobsForTemplate.find((j) => j.id === jobId);
    if (!draggedJob || draggedJob.currentStage === targetStage) return;

    // Optimistic update on jobs list cache
    queryClient.setQueryData(jobKeys.list(), (old: unknown) => {
      if (!Array.isArray(old)) return old;
      return old.map((j: JobWithTasksAndClients) =>
        j.id === jobId ? { ...j, currentStage: targetStage } : j,
      );
    });

    // Also update any byClient caches
    queryClient.setQueriesData({ queryKey: jobKeys.all }, (old: unknown) => {
      if (!Array.isArray(old)) return old;
      return old.map((j: JobWithTasksAndClients) =>
        j.id === jobId ? { ...j, currentStage: targetStage } : j,
      );
    });

    updateJobStage.mutate({ jobId, currentStage: targetStage });
  };

  const setActiveTemplateId = (id: string) => {
    navigate({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      search: ((prev: Record<string, unknown>) => ({
        ...prev,
        type: id,
      })) as any,
    });
  };

  return (
    <div className="space-y-4">
      {/* Template tabs */}
      <div className="flex items-center gap-1 border-b">
        {visibleTemplates.map((t) => {
          const tabCount = jobs.filter(
            (j) =>
              j.templateId === t.id || (!j.templateId && j.jobType === t.slug),
          ).length;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTemplateId(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTemplateId === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t.name}
              <Badge>{tabCount}</Badge>
            </button>
          );
        })}
      </div>

      {/* Board columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageJobs = jobsForTemplate.filter(
              (j) => j.currentStage === stage.value,
            );
            return (
              <KanbanColumn key={stage.value} stage={stage} jobs={stageJobs} />
            );
          })}
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
          {activeJob ? (
            <div className="rotate-1 opacity-95 shadow-xl">
              <JobCard job={activeJob} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
