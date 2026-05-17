import type { ColumnDef } from '#/components/data-table'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { MoreVertical, Paperclip } from 'lucide-react'
import type { FileNote } from '#/db/schema'
import EditNoteMenuItem from './edit-note-menu-item'

export const noteColumns: ColumnDef<FileNote & { documents?: unknown[] }>[] = [
  {
    id: 'title',
    header: 'Title',
    accessorKey: 'title',
    enableSorting: true,
  },
  {
    id: 'noteType',
    header: 'Type',
    accessorKey: 'noteType',
    enableSorting: true,
    cell: ({ getValue }) => (
      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
        {String(getValue())}
      </span>
    ),
  },
  {
    id: 'body',
    header: 'Body',
    accessorKey: 'body',
    cell: ({ getValue }) => (
      <div className="truncate max-w-[300px]" title={String(getValue())}>
        {String(getValue())}
      </div>
    ),
  },
  {
    id: 'documents',
    header: 'Docs',
    accessorFn: (row) => (row.documents as unknown[])?.length ?? 0,
    cell: ({ getValue }) => {
      const count = Number(getValue() ?? 0)
      if (!count) {
        return <span className="text-muted-foreground text-xs">—</span>
      }
      return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Paperclip className="h-3 w-3" />
          {count}
        </span>
      )
    },
  },
  {
    id: 'isPrivate',
    header: 'Visibility',
    accessorKey: 'isPrivate',
    cell: ({ getValue }) => (getValue() ? 'Private' : 'Shared'),
  },
  {
    id: 'createdAt',
    header: 'Created',
    accessorKey: 'createdAt',
    enableSorting: true,
    cell: ({ getValue }) => {
      const date = new Date(String(getValue()))
      return date.toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    },
  },
  {
    id: 'actions',
    header: '',
    width: '50px',
    cell: ({ row }) => {
      const note = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <EditNoteMenuItem note={note} />
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
