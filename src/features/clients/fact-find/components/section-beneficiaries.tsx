import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateBeneficiary,
  useUpdateBeneficiary,
  useDeleteBeneficiary,
} from "../hooks";
import {
  BENEFICIARY_RELATIONSHIPS,
  BENEFICIARY_APPLIES_TO,
  beneficiaryRelationshipLabel,
  beneficiaryAppliesToLabel,
} from "../schemas";

type Beneficiary = {
  id: string;
  name: string;
  relationship: string;
  allocation: number | null;
  appliesTo: string;
  notes: string | null;
};

export default function SectionBeneficiaries({
  clientId,
  beneficiaries,
}: {
  clientId: string;
  beneficiaries: Beneficiary[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <BeneficiaryDialog clientId={clientId} />
      </div>

      {beneficiaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <HeartHandshake className="mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No beneficiaries yet</p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {beneficiaries.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <div className="text-sm font-medium">{b.name}</div>
                <div className="text-xs text-muted-foreground">
                  {beneficiaryRelationshipLabel(b.relationship)} ·{" "}
                  {beneficiaryAppliesToLabel(b.appliesTo)}
                  {b.allocation != null ? ` · ${b.allocation}%` : ""}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <BeneficiaryDialog
                  clientId={clientId}
                  beneficiary={b}
                  trigger={
                    <Button variant="ghost" size="icon">
                      <Pencil className="size-4" />
                    </Button>
                  }
                />
                <DeleteButton clientId={clientId} beneficiaryId={b.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeleteButton({
  clientId,
  beneficiaryId,
}: {
  clientId: string;
  beneficiaryId: string;
}) {
  const del = useDeleteBeneficiary();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-destructive"
      disabled={del.isPending}
      onClick={() =>
        del.mutate(
          { clientId, beneficiaryId },
          {
            onSuccess: () => toast.success("Beneficiary removed"),
            onError: (e: Error) => toast.error(e.message),
          },
        )
      }
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

function BeneficiaryDialog({
  clientId,
  beneficiary,
  trigger,
}: {
  clientId: string;
  beneficiary?: Beneficiary;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const create = useCreateBeneficiary();
  const update = useUpdateBeneficiary();
  const isEditing = !!beneficiary;

  const [name, setName] = useState(beneficiary?.name ?? "");
  const [relationship, setRelationship] = useState(
    beneficiary?.relationship ?? "OTHER",
  );
  const [allocation, setAllocation] = useState(
    beneficiary?.allocation != null ? String(beneficiary.allocation) : "",
  );
  const [appliesTo, setAppliesTo] = useState(beneficiary?.appliesTo ?? "WILL");
  const [notes, setNotes] = useState(beneficiary?.notes ?? "");

  const isPending = create.isPending || update.isPending;

  const submit = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    const payload = {
      clientId,
      name,
      relationship: relationship as
        | "SPOUSE"
        | "CHILD"
        | "FAMILY"
        | "CHARITY"
        | "ESTATE"
        | "OTHER",
      allocation: allocation ? Number(allocation) : undefined,
      appliesTo: appliesTo as "WILL" | "SUPER" | "INSURANCE",
      notes,
    };
    const opts = {
      onSuccess: () => {
        toast.success(isEditing ? "Beneficiary updated" : "Beneficiary added");
        setOpen(false);
      },
      onError: (e: Error) => toast.error(e.message),
    };
    if (isEditing) {
      update.mutate({ ...payload, beneficiaryId: beneficiary.id }, opts);
    } else {
      create.mutate(payload, opts);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 size-4" />
            Add Beneficiary
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Beneficiary" : "Add Beneficiary"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">
              Name
            </Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">
                Relationship
              </Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BENEFICIARY_RELATIONSHIPS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">
                Applies To
              </Label>
              <Select value={appliesTo} onValueChange={setAppliesTo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BENEFICIARY_APPLIES_TO.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">
              Allocation (%)
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={allocation}
              onChange={(e) => setAllocation(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">
              Notes
            </Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? "Saving…" : isEditing ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
