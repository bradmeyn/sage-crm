import { useState, useMemo } from "react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { Check, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useClients, useLinkPartner } from "@/features/clients/hooks";
import {
  partnerLinkSchema,
  type PartnerLinkFormValues,
  PARTNER_RELATIONSHIPS,
} from "@/features/clients/schemas";

interface Props {
  clientId: string;
}

export default function LinkPartnerDialog({ clientId }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: allClients = [] } = useClients();
  const linkPartner = useLinkPartner();

  const form = useForm<PartnerLinkFormValues>({
    resolver: zodResolver(partnerLinkSchema),
    defaultValues: { relationship: "SPOUSE", partnerId: "" },
  });

  const selectedPartnerId = form.watch("partnerId");

  // Exclude self and already-partnered clients
  const eligible = useMemo(
    () =>
      allClients.filter(
        (c) =>
          c.id !== clientId &&
          !c.partnerId &&
          (search === "" ||
            `${c.firstName} ${c.lastName}`
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            (c.preferredName ?? "")
              .toLowerCase()
              .includes(search.toLowerCase())),
      ),
    [allClients, clientId, search],
  );

  const selectedClient = allClients.find((c) => c.id === selectedPartnerId);

  const onSubmit = (values: PartnerLinkFormValues) => {
    linkPartner.mutate(
      {
        clientId,
        partnerId: values.partnerId,
        relationship: values.relationship,
      },
      {
        onSuccess: () => {
          toast.success("Partner linked");
          setOpen(false);
          form.reset();
          setSearch("");
        },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      form.reset();
      setSearch("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Link Partner
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Link Partner</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="partnerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <FormControl>
                    <div className="rounded-md border">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search clients..."
                          value={search}
                          onValueChange={setSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No eligible clients found</CommandEmpty>
                          <CommandGroup>
                            {eligible.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={c.id}
                                onSelect={() => field.onChange(c.id)}>
                                <Check
                                  className={`mr-2 h-4 w-4 ${field.value === c.id ? "opacity-100" : "opacity-0"}`}
                                />
                                {c.firstName}
                                {c.preferredName
                                  ? ` (${c.preferredName})`
                                  : ""}{" "}
                                {c.lastName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </div>
                  </FormControl>
                  {selectedClient && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {selectedClient.firstName}{" "}
                      {selectedClient.lastName}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="relationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PARTNER_RELATIONSHIPS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={linkPartner.isPending || !selectedPartnerId}>
                {linkPartner.isPending ? "Linking…" : "Link Partner"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
