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
  insuranceFormSchema,
  type InsuranceFormValues,
  INSURANCE_CATEGORIES,
  PREMIUM_FREQUENCIES,
  INSURANCE_OWNER_OPTIONS,
  INSURANCE_STATUSES,
} from "../schemas";
import { useCreateInsurance, useUpdateInsurance } from "../hooks";
import type { ClientInsurance } from "@/db/schema";

interface InsuranceDialogProps {
  clientId: string;
  policy?: ClientInsurance;
  trigger?: React.ReactNode;
  onClose?: () => void;
}

export default function InsuranceDialog({
  clientId,
  policy,
  trigger,
  onClose,
}: InsuranceDialogProps) {
  const [open, setOpen] = useState(false);
  const createInsurance = useCreateInsurance();
  const updateInsurance = useUpdateInsurance();
  const isEditing = !!policy;

  const form = useForm<InsuranceFormValues>({
    resolver: zodResolver(insuranceFormSchema),
    defaultValues: {
      category: policy?.category ?? "OTHER",
      insurer: policy?.insurer ?? "",
      policyNumber: policy?.policyNumber ?? "",
      coverAmount: policy?.coverAmount ?? undefined,
      premium: policy?.premium ?? undefined,
      premiumFrequency: policy?.premiumFrequency ?? "MONTHLY",
      owner: policy?.owner ?? "CLIENT",
      status: policy?.status ?? "ACTIVE",
      startDate: policy?.startDate ?? "",
      reviewDate: policy?.reviewDate ?? "",
      notes: policy?.notes ?? "",
    },
  });

  const onSubmit = (data: InsuranceFormValues) => {
    if (isEditing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateInsurance.mutate(
        { ...data, clientId, insuranceId: policy.id } as any,
        {
          onSuccess: () => {
            toast.success("Policy updated");
            handleClose();
          },
          onError: (err: Error) => toast.error(`Error: ${err.message}`),
        },
      );
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createInsurance.mutate({ ...data, clientId } as any, {
        onSuccess: () => {
          toast.success("Policy added");
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

  const isPending = createInsurance.isPending || updateInsurance.isPending;

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
            Add Policy
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Policy" : "Add Insurance Policy"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INSURANCE_CATEGORIES.map((c) => (
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INSURANCE_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="insurer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurer</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. AIA, TAL, MLC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="policyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Optional"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="coverAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Amount ($)</FormLabel>
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
                name="owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INSURANCE_OWNER_OPTIONS.map((o) => (
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="premium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Premium ($)</FormLabel>
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
                name="premiumFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Premium Frequency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PREMIUM_FREQUENCIES.map((f) => (
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reviewDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                    : "Add Policy"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
