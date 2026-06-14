import type { ColumnDef } from "@/components/data-table";
import { ChevronRight, User } from "lucide-react";
import type { Client } from "@/db/schema";

const cell = (value: unknown) => (
  <span className="text-sm">{value ? String(value) : "—"}</span>
);

export const clientColumns: ColumnDef<Client>[] = [
  {
    id: "firstName",
    header: "First Name",
    accessorKey: "firstName",
    enableSorting: true,
    cell: ({ row }) => {
      const c = row.original;
      return (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-white border flex items-center justify-center shrink-0">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <span className="text-sm">{c.firstName}</span>
        </div>
      );
    },
  },
  {
    id: "lastName",
    header: "Last Name",
    accessorKey: "lastName",
    enableSorting: true,
    cell: ({ getValue }) => cell(getValue()),
  },
  {
    id: "email",
    header: "Email",
    accessorKey: "email",
    enableSorting: true,
    cell: ({ getValue }) => cell(getValue()),
  },
  {
    id: "phone",
    header: "Phone",
    accessorKey: "phone",
    cell: ({ getValue }) => cell(getValue()),
  },
  {
    id: "chevron",
    header: "",
    width: "40px",
    cell: () => (
      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
    ),
  },
];
