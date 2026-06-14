import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  incomeFormSchema,
  type IncomeFormValues,
  INCOME_CATEGORIES,
  FREQUENCIES,
  INCOME_OWNER_OPTIONS,
} from "../schemas";
import { useCreateIncome, useUpdateIncome } from "../hooks";
import type { ClientIncome } from "@/db/schema";

interface IncomeDialogProps {
  clientId: string;
  income?: ClientIncome;
  trigger?: React.ReactNode;
  onClose?: () => void;
}

export default function IncomeDialog({
  clientId,
  income,
  trigger,
  onClose,
}: IncomeDialogProps) {
  const [open, setOpen] = useState(false);
  const createIncome = useCreateIncome();
  const updateIncome = useUpdateIncome();
  const isEditing = !!income;

  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      category: income?.category ?? "OTHER",
      name: income?.name ?? "",
      amount: income?.amount ?? 0,
      frequency: income?.frequency ?? "ANNUALLY",
      owner: income?.owner ?? "CLIENT",
      notes: income?.notes ?? "",
    },
  });

  const onSubmit = (data: IncomeFormValues) => {
    if (isEditing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateIncome.mutate({ ...data, clientId, incomeId: income.id } as any, {
        onSuccess: () => {
          toast.success("Income updated");
          handleClose();
        },
        onError: (err: Error) => toast.error(`Error: ${err.message}`),
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createIncome.mutate({ ...data, clientId } as any, {
        onSuccess: () => {
          toast.success("Income added");
          handleClose();
        },
        onError: (err: Error) => toast.error(`Error: ${err.message}`),
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    form.reset();
    onClose?.();
  };

  const isPending = createIncome.isPending || updateIncome.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
        else setOpen(true);
      }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Income
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Income" : "Add Income"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INCOME_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Salary - Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FREQUENCIES.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INCOME_OWNER_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional notes..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Add Income"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
