import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useStrategyTemplates } from "../hooks";
import { STRATEGY_CATEGORIES, strategyCategoryLabel } from "../schemas";

type AddArgs = { templateId?: string; category?: string; type?: string; title?: string };

export default function StrategyPickerDialog({
  onAdd,
  pending,
}: {
  onAdd: (args: AddArgs) => void;
  pending?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { data: templates = [], isLoading } = useStrategyTemplates();

  const pick = (args: AddArgs) => {
    onAdd(args);
    setOpen(false);
  };

  const byCategory = STRATEGY_CATEGORIES.map((c) => ({
    category: c,
    items: templates.filter((t) => t.category === c.value),
  })).filter((g) => g.items.length > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={pending}>
          <Plus className="size-4" />
          Add recommendation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add a recommendation</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-5 overflow-auto py-1">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading strategies…</p>
          )}
          {byCategory.map((group) => (
            <div key={group.category.value}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {strategyCategoryLabel(group.category.value)}
              </p>
              <div className="space-y-1.5">
                {group.items.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pick({ templateId: t.id })}
                    className="w-full rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => pick({ title: "New recommendation" })}
              className="w-full rounded-md border border-dashed px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50"
            >
              + Blank recommendation
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
