import type { ColumnDef } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import type { ClientAsset } from "@/db/schema";
import { ASSET_CATEGORIES, OWNER_OPTIONS } from "../schemas";
import AssetDialog from "./asset-dialog";

const fmt = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

function categoryLabel(value: string) {
  return ASSET_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function ownerLabel(value: string) {
  return OWNER_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function buildAssetColumns(
  clientId: string,
  onDelete: (asset: ClientAsset) => void,
): ColumnDef<ClientAsset>[] {
  return [
    {
      id: "category",
      header: "Category",
      accessorKey: "category",
      cell: ({ getValue }) => (
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
          {categoryLabel(String(getValue()))}
        </span>
      ),
    },
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
    },
    {
      id: "owner",
      header: "Owner",
      accessorKey: "owner",
      cell: ({ getValue }) => ownerLabel(String(getValue())),
    },
    {
      id: "value",
      header: "Value",
      accessorKey: "value",
      cell: ({ getValue }) => (
        <span className="font-medium">{fmt.format(Number(getValue()))}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      width: "50px",
      cell: ({ row }) => {
        const asset = row.original;
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
              <AssetDialog
                clientId={clientId}
                asset={asset}
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
                  onDelete(asset);
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
