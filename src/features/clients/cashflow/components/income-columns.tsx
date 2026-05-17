import type { ColumnDef } from '#/components/data-table'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'
import type { ClientIncome } from '#/db/schema'
import { INCOME_CATEGORIES, FREQUENCIES, INCOME_OWNER_OPTIONS, toAnnual } from '../schemas'
import IncomeDialog from './income-dialog'

const fmt = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })

function categoryLabel(value: string) {
  return INCOME_CATEGORIES.find((c) => c.value === value)?.label ?? value
}

function frequencyLabel(value: string) {
  return FREQUENCIES.find((f) => f.value === value)?.label ?? value
}

function ownerLabel(value: string) {
  return INCOME_OWNER_OPTIONS.find((o) => o.value === value)?.label ?? value
}

export function buildIncomeColumns(
  clientId: string,
  onDelete: (income: ClientIncome) => void,
): ColumnDef<ClientIncome>[] {
  return [
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'category',
      cell: ({ getValue }) => (
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
          {categoryLabel(String(getValue()))}
        </span>
      ),
    },
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
    },
    {
      id: 'owner',
      header: 'Owner',
      accessorKey: 'owner',
      cell: ({ getValue }) => ownerLabel(String(getValue())),
    },
    {
      id: 'amount',
      header: 'Amount',
      accessorFn: (row) => `${fmt.format(row.amount)} / ${frequencyLabel(row.frequency)}`,
    },
    {
      id: 'annual',
      header: 'Annual',
      accessorFn: (row) => toAnnual(row.amount, row.frequency),
      cell: ({ getValue }) => (
        <span className="font-medium">{fmt.format(Number(getValue()))}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      width: '50px',
      cell: ({ row }) => {
        const income = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <IncomeDialog
                clientId={clientId}
                income={income}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Edit
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuItem
                className="text-red-600"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(income)
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
