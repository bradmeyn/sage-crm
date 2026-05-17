import { useNavigate, useSearch } from '@tanstack/react-router'
import { List, LayoutGrid } from 'lucide-react'

export default function ViewToggle() {
  const search = useSearch({ strict: false }) as { view?: string }
  const navigate = useNavigate()
  const currentView = search.view ?? 'table'

  const setView = (view: 'table' | 'board') => {
    navigate({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      search: ((prev: Record<string, unknown>) => ({ ...prev, view })) as any,
    })
  }

  return (
    <div className="flex items-center border rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setView('table')}
        className={`flex items-center justify-center h-8 w-8 transition-colors ${
          currentView === 'table'
            ? 'bg-primary text-primary-foreground'
            : 'bg-background text-muted-foreground hover:bg-muted'
        }`}
        title="Table view"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setView('board')}
        className={`flex items-center justify-center h-8 w-8 transition-colors ${
          currentView === 'board'
            ? 'bg-primary text-primary-foreground'
            : 'bg-background text-muted-foreground hover:bg-muted'
        }`}
        title="Board view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
    </div>
  )
}
