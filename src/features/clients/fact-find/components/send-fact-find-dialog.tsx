import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useCreateFactFindRequest } from "../hooks";

type Section = { key: string; label: string };

// Sections a client typically self-completes — pre-selected for convenience.
const DEFAULT_SELECTED = new Set([
  "personal",
  "dependants",
  "estate",
  "beneficiaries",
  "health",
]);

export default function SendFactFindDialog({
  clientId,
  sections,
}: {
  clientId: string;
  sections: readonly Section[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set([...DEFAULT_SELECTED].filter((k) =>
      sections.some((s) => s.key === k),
    )),
  );
  const create = useCreateFactFindRequest();

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const send = () => {
    if (selected.size === 0) {
      toast.error("Select at least one section");
      return;
    }
    create.mutate(
      {
        clientId,
        sections: [...selected] as Parameters<
          typeof create.mutate
        >[0]["sections"],
      },
      {
        onSuccess: () => {
          toast.success("Fact find sent to client");
          setOpen(false);
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Send className="size-4" />
          Send to client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Send fact find to client</DialogTitle>
          <DialogDescription>
            Choose which sections to ask the client to complete. They'll get an
            emailed link and confirm their date of birth to open it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2.5 py-1">
          {sections.map((s) => (
            <label key={s.key} className="flex items-center gap-2.5 text-sm">
              <Checkbox
                checked={selected.has(s.key)}
                onCheckedChange={() => toggle(s.key)}
              />
              {s.label}
            </label>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={send} disabled={create.isPending}>
            {create.isPending ? "Sending…" : "Send link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
