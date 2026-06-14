import { Check } from "lucide-react";
import { useUpdateJobStage } from "../hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface JobStageStepperProps {
  jobId: string;
  stages: { value: string; label: string }[];
  currentStage: string;
}

export default function JobStageStepper({
  jobId,
  stages,
  currentStage,
}: JobStageStepperProps) {
  const currentIndex = stages.findIndex((s) => s.value === currentStage);
  const updateStage = useUpdateJobStage();

  const handleStageClick = (stageValue: string) => {
    if (stageValue === currentStage) return;
    updateStage.mutate(
      { jobId, currentStage: stageValue },
      {
        onError: (err: Error) => toast.error(`Error: ${err.message}`),
      },
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center min-w-max py-2">
        {stages.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={stage.value} className="flex items-center">
              <button
                type="button"
                onClick={() => handleStageClick(stage.value)}
                disabled={updateStage.isPending}
                className={cn(
                  "flex flex-col items-center gap-1.5 group",
                  updateStage.isPending && "opacity-50 cursor-not-allowed",
                )}>
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all",
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : isCurrent
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-muted border-muted-foreground/30 text-muted-foreground group-hover:border-primary/50",
                  )}>
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    "text-xs whitespace-nowrap max-w-[80px] text-center leading-tight",
                    isCurrent
                      ? "text-primary font-semibold"
                      : "text-muted-foreground",
                  )}>
                  {stage.label}
                </span>
              </button>

              {idx < stages.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-8 mx-1 mt-[-14px] transition-colors",
                    idx < currentIndex
                      ? "bg-primary"
                      : "bg-muted-foreground/20",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
