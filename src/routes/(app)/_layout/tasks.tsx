import { createFileRoute } from "@tanstack/react-router";
import { ListTodo } from "lucide-react";

export const Route = createFileRoute("/(app)/_layout/tasks")({
  component: TasksPage,
});

function TasksPage() {
  return (
    <div className="py-8">
      <h1 className="heading-primary">Tasks</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        What's due, overdue, and which reviews are coming up.
      </p>

      <div className="mt-10 flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-primary/10">
          <ListTodo className="size-6 text-primary" />
        </div>
        <h2 className="mt-4 text-base font-medium">Task management is coming</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          A unified view of your tasks, client reviews, and fee-consent renewals
          will live here.
        </p>
      </div>
    </div>
  );
}
