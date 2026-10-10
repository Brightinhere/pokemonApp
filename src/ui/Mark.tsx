type MarkKind = 'x4' | 'x2' | 'x1' | 'half' | 'quarter' | 'immune'

const LABELS: Record<MarkKind, string> = {
  x4: 'takes 4×',
  x2: 'takes 2×',
  x1: 'takes 1×',
  half: 'takes ½×',
  quarter: 'takes ¼×',
  immune: 'immune',
}

const kindOf = (multiplier: number): MarkKind =>
  multiplier === 0
    ? 'immune'
    : multiplier <= 0.25
      ? 'quarter'
      : multiplier < 1
        ? 'half'
        : multiplier === 1
          ? 'x1'
          : multiplier < 4
            ? 'x2'
            : 'x4'

const square = 'block size-3.5'

/**
 * A matchup mark (design/README.md): filled = takes more damage, hollow = takes less,
 * ring = no damage. Readable without colour; the label is what screen readers hear.
 */
export function Mark({ multiplier, fresh = false }: { multiplier: number; fresh?: boolean }) {
  const kind = kindOf(multiplier)
  return (
    <span
      role="img"
      aria-label={LABELS[kind]}
      data-mark={kind}
      className={`inline-flex items-center justify-center gap-[3px] align-middle ${fresh ? 'mark-fresh' : ''}`}
    >
      {kind === 'x4' && (
        <>
          <i className={`${square} bg-ink`} />
          <i className={`${square} bg-ink`} />
        </>
      )}
      {kind === 'x2' && <i className={`${square} bg-ink`} />}
      {kind === 'x1' && <i className="block size-1 rounded-full bg-rule-strong" />}
      {kind === 'half' && <i className={`${square} border-2 border-ink`} />}
      {kind === 'quarter' && <i className="block size-[9px] border-2 border-ink" />}
      {kind === 'immune' && <i className={`${square} rounded-full border-2 border-ink`} />}
    </span>
  )
}
