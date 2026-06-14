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
  liabilityFormSchema,
  type LiabilityFormValues,
  LIABILITY_CATEGORIES,
  OWNER_OPTIONS,
} from "../schemas";
import { useCreateLiability, useUpdateLiability } from "../hooks";
import type { ClientLiability } from "@/db/schema";

interface LiabilityDialogProps {
  clientId: string;
  liability?: ClientLiability;
  trigger?: React.ReactNode;
  onClose?: () => void;
}

export default function LiabilityDialog({
  clientId,
  liability,
  trigger,
  onClose,
}: LiabilityDialogProps) {
  const [open, setOpen] = useState(false);
  const createLiability = useCreateLiability();
  const updateLiability = useUpdateLiability();
  const isEditing = !!liability;

  const form = useForm<LiabilityFormValues>({
    resolver: zodResolver(liabilityFormSchema),
    defaultValues: {
      category: liability?.category ?? "OTHER",
      name: liability?.name ?? "",
      balance: liability?.balance ?? 0,
      limit: liability?.limit ?? undefined,
      interestRateDisplay:
        liability?.interestRate != null
          ? liability.interestRate / 100
          : undefined,
      owner: liability?.owner ?? "CLIENT",
      notes: liability?.notes ?? "",
    },
  });

  const onSubmit = (data: LiabilityFormValues) => {
    const payload = {
      clientId,
      category: data.category,
      name: data.name,
      balance: data.balance,
      limit: data.limit,
      // Convert percentage display value to basis points for storage
      interestRate:
        data.interestRateDisplay != null
          ? Math.round(data.interestRateDisplay * 100)
          : undefined,
      owner: data.owner,
      notes: data.notes,
    };

    if (isEditing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateLiability.mutate({ ...payload, liabilityId: liability.id } as any, {
        onSuccess: () => {
          toast.success("Liability updated");
          handleClose();
        },
        onError: (err: Error) => toast.error(`Error: ${err.message}`),
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createLiability.mutate(payload as any, {
        onSuccess: () => {
          toast.success("Liability added");
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

  const isPending = createLiability.isPending || updateLiability.isPending;

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
            Add Liability
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Liability" : "Add Liability"}
          </DialogTitle>
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
                      {LIABILITY_CATEGORIES.map((c) => (
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
                    <Input placeholder="e.g. ANZ Home Loan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Balance ($)</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Optional"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interestRateDisplay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        placeholder="Optional"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      />
                    </FormControl>
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
                      {OWNER_OPTIONS.map((o) => (
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
                    : "Add Liability"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
