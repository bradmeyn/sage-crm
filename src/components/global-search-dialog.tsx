import { Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useClients } from "@/features/clients/hooks";
import { useNavigate } from "@tanstack/react-router";

export default function SearchDialog() {
  const [open, setOpen] = useState(false);
  const { data: clients = [] } = useClients();
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-8 px-3 rounded-md bg-background border border-input text-muted-foreground hover:text-foreground hover:border-ring/50 transition-colors text-sm min-w-[200px]">
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search clients..." />
        <CommandList>
          <CommandEmpty>No clients found.</CommandEmpty>
          <CommandGroup heading="Clients">
            {clients.map((client) => (
              <CommandItem
                key={client.id}
                onSelect={() => {
                  navigate({
                    to: "/clients/$clientId",
                    params: { clientId: client.id },
                  });
                  setOpen(false);
                }}>
                <Users className="mr-2 h-4 w-4" />
                <span>
                  {client.firstName} {client.lastName}
                </span>
                {client.email && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {client.email}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
