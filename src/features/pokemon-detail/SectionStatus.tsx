import { Button } from '../../ui'

/** Loading and error states shared by the live sections. */
export function SectionLoading({ label }: { label: string }) {
  return (
    <p role="status" className="text-ink-soft">
      Loading {label}…
    </p>
  )
}

export function SectionError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div role="alert" className="grid justify-items-start gap-2">
      <p className="text-ink-soft">The {what} could not be loaded.</p>
      <Button onClick={onRetry}>Try again</Button>
    </div>
  )
}

export function SectionTitle({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="mb-4 text-lg font-bold font-stretch-expanded">
      {children}
    </h2>
  )
}
