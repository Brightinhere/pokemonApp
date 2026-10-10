import { formatDexNumber } from './format'

export function DexNumber({
  speciesId,
  className = '',
}: {
  speciesId: number
  className?: string
}) {
  return (
    <span className={`font-semibold text-ink-soft font-stretch-condensed ${className}`}>
      {formatDexNumber(speciesId)}
    </span>
  )
}
