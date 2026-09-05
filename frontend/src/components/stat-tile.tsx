import { Card } from '@/components/ui/card'

/**
 * One figure in a section's summary strip (net worth, annual surplus, …).
 *
 * Deliberately uncoloured — green/red figures fight with the theme. The label
 * already says whether it's assets or liabilities, so colour was carrying no
 * information.
 */
export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="gap-0 p-4 shadow-none">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </Card>
  )
}
