import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, Copy, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  useTemplates,
  useCreateTemplate,
  useCloneTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from "../hooks";
import type { JobTemplate } from "@/db/schema";

// ─── Form schema ──────────────────────────────────────────────────────────────

const templateFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  stages: z
    .array(
      z.object({
        value: z.string().min(1, "Stage value is required"),
        label: z.string().min(1, "Stage label is required"),
      }),
    )
    .min(1, "At least one stage is required"),
  defaultTasksText: z.string(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

function deriveStageValue(label: string): string {
  return (
    label
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || "STAGE"
  );
}

// ─── Template Form Dialog ─────────────────────────────────────────────────────

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template?: JobTemplate;
}

function TemplateFormDialog({
  open,
  onOpenChange,
  template,
}: TemplateFormDialogProps) {
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const isEdit = !!template;

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: template
      ? {
          name: template.name,
          stages: template.stages,
          defaultTasksText: template.defaultTasks.join("\n"),
        }
      : {
          name: "",
          stages: [{ value: "IN_PROGRESS", label: "In Progress" }],
          defaultTasksText: "",
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "stages",
  });

  const onSubmit = (values: TemplateFormValues) => {
    const defaultTasks = values.defaultTasksText
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);

    if (isEdit && template) {
      updateTemplate.mutate(
        {
          id: template.id,
          name: values.name,
          stages: values.stages,
          defaultTasks,
        },
        {
          onSuccess: () => {
            toast.success("Template updated");
            onOpenChange(false);
          },
          onError: (err: Error) => toast.error(err.message),
        },
      );
    } else {
      createTemplate.mutate(
        { name: values.name, stages: values.stages, defaultTasks },
        {
          onSuccess: () => {
            toast.success("Template created");
            onOpenChange(false);
            form.reset();
          },
          onError: (err: Error) => toast.error(err.message),
        },
      );
    }
  };

  const isPending = createTemplate.isPending || updateTemplate.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Template" : "Create Template"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. SMSF Setup" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Stages */}
            <div className="space-y-2">
              <FormLabel>Stages</FormLabel>
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`stages.${idx}.label`}
                      render={({ field: f }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="Stage label"
                              {...f}
                              onChange={(e) => {
                                f.onChange(e);
                                form.setValue(
                                  `stages.${idx}.value`,
                                  deriveStageValue(e.target.value),
                                );
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      disabled={fields.length <= 1}
                      className="text-muted-foreground hover:text-destructive disabled:opacity-30">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ value: "NEW_STAGE", label: "" })}>
                <Plus className="h-3 w-3 mr-1" />
                Add Stage
              </Button>
              {form.formState.errors.stages?.root && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.stages.root.message}
                </p>
              )}
            </div>

            {/* Default Tasks */}
            <FormField
              control={form.control}
              name="defaultTasksText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Default Tasks{" "}
                    <span className="text-muted-foreground font-normal">
                      (one per line)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Schedule initial meeting&#10;Collect client documents&#10;..."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : isEdit
                    ? "Save Changes"
                    : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Template Manager ─────────────────────────────────────────────────────────

export default function TemplateManager() {
  const { data: templates } = useTemplates();
  const cloneTemplate = useCloneTemplate();
  const deleteTemplate = useDeleteTemplate();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<JobTemplate | null>(null);

  const handleClone = (tmpl: JobTemplate) => {
    cloneTemplate.mutate(
      { id: tmpl.id },
      {
        onSuccess: () => toast.success(`Cloned "${tmpl.name}"`),
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  const handleDelete = (tmpl: JobTemplate) => {
    if (!confirm(`Delete template "${tmpl.name}"? This cannot be undone.`))
      return;
    deleteTemplate.mutate(
      { id: tmpl.id },
      {
        onSuccess: () => toast.success("Template deleted"),
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Job Templates</h2>
          <p className="text-sm text-muted-foreground">
            System templates are locked — clone to customise.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="rounded-xl border bg-background divide-y">
        {templates.map((tmpl) => {
          const displayStages = tmpl.stages.slice(0, 4);
          const extra = tmpl.stages.length - displayStages.length;

          return (
            <div key={tmpl.id} className="flex items-center gap-4 px-4 py-3">
              {/* Name + badges */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{tmpl.name}</span>
                  {tmpl.isSystem && (
                    <Badge variant="outline" className="text-xs">
                      System
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {displayStages.map((s) => (
                    <span
                      key={s.value}
                      className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                      {s.label}
                    </span>
                  ))}
                  {extra > 0 && (
                    <span className="text-xs text-muted-foreground">
                      +{extra} more
                    </span>
                  )}
                </div>
              </div>

              {/* Stage + task counts */}
              <div className="text-xs text-muted-foreground text-right shrink-0 hidden sm:block">
                <div>{tmpl.stages.length} stages</div>
                <div>{tmpl.defaultTasks.length} tasks</div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleClone(tmpl)}
                  disabled={cloneTemplate.isPending}
                  title="Clone">
                  <Copy className="h-4 w-4" />
                </Button>
                {!tmpl.isSystem && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditTarget(tmpl)}
                      title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(tmpl)}
                      disabled={deleteTemplate.isPending}
                      title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {templates.length === 0 && (
          <div className="py-10 text-center text-muted-foreground text-sm">
            No templates yet
          </div>
        )}
      </div>

      <TemplateFormDialog open={createOpen} onOpenChange={setCreateOpen} />

      {editTarget && (
        <TemplateFormDialog
          open
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          template={editTarget}
        />
      )}
    </div>
  );
}
