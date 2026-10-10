import { useState } from 'react'

interface PokemonArtProps {
  src: string | null
  size: number
  /** Empty for decorative art next to a visible name. */
  alt?: string
  className?: string
  /** Eager-load art that is visible on first paint (e.g. the detail hero). */
  eager?: boolean
}

/** Fixed-size artwork that falls back to a same-size placeholder when missing or broken. */
export function PokemonArt({
  src,
  size,
  alt = '',
  className = '',
  eager = false,
}: PokemonArtProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  // Never wider than its container: shrinks on small screens, keeping the square shape.
  const box = { width: size, maxWidth: '100%', aspectRatio: '1 / 1', height: 'auto' }

  if (!src || failedSrc === src) {
    return (
      <span
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        data-testid="art-placeholder"
        style={box}
        className={`grid shrink-0 place-items-center rounded-panel border-[1.5px] border-dashed border-rule-strong ${className}`}
      >
        <span
          aria-hidden="true"
          className="h-1/3 w-1/3 rounded-full border-[1.5px] border-rule-strong"
        />
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={box}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailedSrc(src)}
      className={`shrink-0 object-contain ${className}`}
    />
  )
}
