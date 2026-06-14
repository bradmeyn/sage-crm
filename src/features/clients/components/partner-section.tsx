import { Link } from "@tanstack/react-router";
import { Heart, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUnlinkPartner } from "@/features/clients/hooks";
import LinkPartnerDialog from "./link-partner-dialog";
import { PARTNER_RELATIONSHIPS } from "@/features/clients/schemas";
import type { ClientWithPartner } from "@/server/functions/clients";

interface Props {
  client: ClientWithPartner;
}

export default function PartnerSection({ client }: Props) {
  const unlinkPartner = useUnlinkPartner();

  const relationshipLabel =
    PARTNER_RELATIONSHIPS.find((r) => r.value === client.partnerRelationship)
      ?.label ?? client.partnerRelationship;

  const handleUnlink = () => {
    if (!client.partner) return;
    unlinkPartner.mutate(
      { clientId: client.id, currentPartnerId: client.partner.id },
      {
        onSuccess: () => toast.success("Partner unlinked"),
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="mb-6 max-w-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Partner</h3>
        {!client.partner && <LinkPartnerDialog clientId={client.id} />}
      </div>

      {client.partner ? (
        <div className="flex items-center justify-between rounded-md border px-4 py-3">
          <div className="flex items-center gap-3">
            <Heart className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <Link
                to="/clients/$clientId"
                params={{ clientId: client.partner.id }}
                className="text-sm font-medium hover:underline">
                {client.partner.firstName}
                {client.partner.preferredName
                  ? ` (${client.partner.preferredName})`
                  : ""}{" "}
                {client.partner.lastName}
              </Link>
              {relationshipLabel && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {relationshipLabel}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUnlink}
            disabled={unlinkPartner.isPending}
            className="text-muted-foreground hover:text-destructive">
            <Unlink className="h-4 w-4 mr-1.5" />
            Unlink
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No partner on file</p>
      )}
    </div>
  );
}
