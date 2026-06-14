import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getGoals } from "@/server/functions/goals";
import {
  goalKeys,
  useGoals,
  useDeleteGoal,
} from "@/features/clients/goals/hooks";
import { buildGoalColumns } from "@/features/clients/goals/components/goal-columns";
import GoalDialog from "@/features/clients/goals/components/goal-dialog";
import { DataTable } from "@/components/data-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutList, Plus } from "lucide-react";
import { toast } from "sonner";
import type { ClientGoal } from "@/db/schema";

export const Route = createFileRoute("/(app)/_layout/clients/$clientId/goals/")(
  {
    component: GoalsPage,
    loader: async ({ params: { clientId }, context: { queryClient } }) => {
      await queryClient.ensureQueryData({
        queryKey: goalKeys.list(clientId),
        queryFn: () => getGoals({ data: { clientId } }),
      });
      return { clientId };
    },
  },
);

function GoalsPage() {
  const { clientId } = Route.useLoaderData();
  const { data: goals = [] } = useGoals(clientId);
  const deleteGoal = useDeleteGoal();

  const columns = useMemo(
    () =>
      buildGoalColumns(clientId, (goal: ClientGoal) => {
        deleteGoal.mutate(
          { goalId: goal.id, clientId },
          {
            onSuccess: () => toast.success("Goal deleted"),
            onError: (err: Error) => toast.error(err.message),
          },
        );
      }),
    [clientId, deleteGoal],
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Goals</h2>
          <p className="text-muted-foreground">
            Financial goals and milestones
          </p>
        </div>
        <GoalDialog clientId={clientId} />
      </div>

      {goals.length > 0 ? (
        <DataTable
          data={goals}
          columns={columns}
          searchPlaceholder="Search goals..."
          searchKeys={["name", "category", "status"]}
          pageSize={20}
          enableSearch={goals.length > 8}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <LayoutList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No goals yet</h3>
          <p className="text-muted-foreground mb-4">
            Add the first goal for this client
          </p>
          <GoalDialog
            clientId={clientId}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Goal
              </Button>
            }
          />
        </div>
      )}
    </Card>
  );
}
