import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section>
      <h1 className="mb-2 text-2xl font-bold">Page not found</h1>
      <p className="mb-4 text-text-muted">There is nothing at this address.</p>
      <Link to="/" className="underline">
        Back to the Pokédex
      </Link>
    </section>
  )
}
