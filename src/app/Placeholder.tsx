import type { ReactNode } from 'react'

/** Stand-in page until the feature's own change replaces it. */
export function Placeholder({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section>
      <h1 className="mb-2 text-2xl font-extrabold font-stretch-expanded">{title}</h1>
      <p className="text-ink-soft">Coming soon.</p>
      {children}
    </section>
  )
}
