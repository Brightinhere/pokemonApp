/** A proportional bar; `max` is the value that fills it (255 for one stat, 720 for a total). */
export function StatBar({
  value,
  max,
  className = 'h-1.5',
}: {
  value: number
  max: number
  className?: string
}) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <span aria-hidden="true" className={`block overflow-hidden rounded-sm bg-rule/60 ${className}`}>
      <span className="block h-full bg-ink" style={{ width: `${percent}%` }} />
    </span>
  )
}
