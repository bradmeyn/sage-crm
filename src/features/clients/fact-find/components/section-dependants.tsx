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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateDependant,
  useUpdateDependant,
  useDeleteDependant,
} from "../hooks";
import { DEPENDANT_RELATIONSHIPS, dependantRelationshipLabel } from "../schemas";

type Dependant = {
  id: string;
  name: string;
  dateOfBirth: string | null;
  relationship: string;
  financiallyDependent: boolean;
  notes: string | null;
};

export default function SectionDependants({
  clientId,
  dependants,
}: {
  clientId: string;
  dependants: Dependant[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DependantDialog clientId={clientId} />
      </div>

      {dependants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <Users className="mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No dependants yet</p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {dependants.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <div className="text-sm font-medium">{d.name}</div>
                <div className="text-xs text-muted-foreground">
                  {dependantRelationshipLabel(d.relationship)}
                  {d.dateOfBirth ? ` · ${d.dateOfBirth}` : ""}
                  {d.financiallyDependent ? " · Financially dependent" : ""}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <DependantDialog
                  clientId={clientId}
                  dependant={d}
                  trigger={
                    <Button variant="ghost" size="icon">
                      <Pencil className="size-4" />
                    </Button>
                  }
                />
                <DeleteButton clientId={clientId} dependantId={d.id} />
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
  dependantId,
}: {
  clientId: string;
  dependantId: string;
}) {
  const del = useDeleteDependant();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-destructive"
      disabled={del.isPending}
      onClick={() =>
        del.mutate(
          { clientId, dependantId },
          {
            onSuccess: () => toast.success("Dependant removed"),
            onError: (e: Error) => toast.error(e.message),
          },
        )
      }
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

function DependantDialog({
  clientId,
  dependant,
  trigger,
}: {
  clientId: string;
  dependant?: Dependant;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const create = useCreateDependant();
  const update = useUpdateDependant();
  const isEditing = !!dependant;

  const [name, setName] = useState(dependant?.name ?? "");
  const [dob, setDob] = useState(dependant?.dateOfBirth ?? "");
  const [relationship, setRelationship] = useState(
    dependant?.relationship ?? "CHILD",
  );
  const [financiallyDependent, setFinanciallyDependent] = useState(
    dependant?.financiallyDependent ?? true,
  );
  const [notes, setNotes] = useState(dependant?.notes ?? "");

  const isPending = create.isPending || update.isPending;

  const submit = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    const payload = {
      clientId,
      name,
      dateOfBirth: dob,
      relationship: relationship as
        | "CHILD"
        | "STEPCHILD"
        | "PARENT"
        | "SIBLING"
        | "OTHER",
      financiallyDependent,
      notes,
    };
    const opts = {
      onSuccess: () => {
        toast.success(isEditing ? "Dependant updated" : "Dependant added");
        setOpen(false);
      },
      onError: (e: Error) => toast.error(e.message),
    };
    if (isEditing) {
      update.mutate({ ...payload, dependantId: dependant.id }, opts);
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
            Add Dependant
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Dependant" : "Add Dependant"}
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
                  {DEPENDANT_RELATIONSHIPS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">
                Date of Birth
              </Label>
              <Input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
          </div>
          <label className="flex items-center gap-2.5">
            <Checkbox
              checked={financiallyDependent}
              onCheckedChange={(v) => setFinanciallyDependent(v === true)}
            />
            <span className="text-sm">Financially dependent</span>
          </label>
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
