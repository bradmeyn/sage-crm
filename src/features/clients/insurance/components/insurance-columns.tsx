import type { ColumnDef } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import type { ClientInsurance } from "@/db/schema";
import {
  INSURANCE_CATEGORIES,
  INSURANCE_STATUSES,
  INSURANCE_OWNER_OPTIONS,
  annualPremium,
} from "../schemas";
import InsuranceDialog from "./insurance-dialog";

const fmt = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  LAPSED: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

function categoryLabel(v: string) {
  return INSURANCE_CATEGORIES.find((c) => c.value === v)?.label ?? v;
}
function statusLabel(v: string) {
  return INSURANCE_STATUSES.find((s) => s.value === v)?.label ?? v;
}
function ownerLabel(v: string) {
  return INSURANCE_OWNER_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

export function buildInsuranceColumns(
  clientId: string,
  onDelete: (policy: ClientInsurance) => void,
): ColumnDef<ClientInsurance>[] {
  return [
    {
      id: "category",
      header: "Type",
      accessorKey: "category",
      cell: ({ getValue }) => (
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
          {categoryLabel(String(getValue()))}
        </span>
      ),
    },
    {
      id: "insurer",
      header: "Insurer",
      accessorKey: "insurer",
    },
    {
      id: "owner",
      header: "Owner",
      accessorKey: "owner",
      cell: ({ getValue }) => ownerLabel(String(getValue())),
    },
    {
      id: "coverAmount",
      header: "Cover",
      accessorKey: "coverAmount",
      cell: ({ getValue }) => {
        const v = getValue();
        if (v == null)
          return <span className="text-muted-foreground text-xs">—</span>;
        return <span className="font-medium">{fmt.format(Number(v))}</span>;
      },
    },
    {
      id: "premium",
      header: "Annual Premium",
      accessorFn: (row) => annualPremium(row.premium, row.premiumFrequency),
      cell: ({ getValue }) => {
        const v = Number(getValue());
        if (!v) return <span className="text-muted-foreground text-xs">—</span>;
        return fmt.format(v);
      },
    },
    {
      id: "reviewDate",
      header: "Review Date",
      accessorKey: "reviewDate",
      cell: ({ getValue }) => {
        const v = getValue();
        if (!v) return <span className="text-muted-foreground text-xs">—</span>;
        return new Date(String(v)).toLocaleDateString("en-AU", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      },
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: ({ getValue }) => {
        const v = String(getValue());
        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${STATUS_STYLES[v] ?? "bg-gray-100 text-gray-600"}`}>
            {statusLabel(v)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      width: "50px",
      cell: ({ row }) => {
        const policy = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <InsuranceDialog
                clientId={clientId}
                policy={policy}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Edit
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuItem
                className="text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(policy);
                }}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
