import { Badge } from '@/components/ui/badge'
import type { MockClient } from '@/lib/mock-clients'

// Active is the unremarkable case — badging it adds noise to every row and
// header. Only the statuses that should make you look twice get a badge.
const NOTABLE: Record<string, { label: string; variant: 'default' | 'outline' | 'destructive' }> = {
  lead: { label: 'Lead', variant: 'default' },
  inactive: { label: 'Inactive', variant: 'outline' },
}

export function StatusBadge({ status }: { status: MockClient['status'] }) {
  const notable = NOTABLE[status]
  if (!notable) return null
  return <Badge variant={notable.variant}>{notable.label}</Badge>
}
