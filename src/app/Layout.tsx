import { NavLink, Outlet } from 'react-router'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-2 ${isActive ? 'bg-surface-raised font-semibold' : 'hover:bg-surface-raised'}`

export function Layout() {
  return (
    <div className="min-h-dvh bg-surface text-text">
      <header className="border-b border-border">
        <nav aria-label="Main" className="mx-auto flex max-w-5xl items-center gap-2 p-3">
          <span className="mr-4 font-bold">Pokémon Squad Lab</span>
          <NavLink to="/" end className={navLinkClass}>
            Pokédex
          </NavLink>
          <NavLink to="/squads" className={navLinkClass}>
            Squads
          </NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl p-4">
        <Outlet />
      </main>
    </div>
  )
}
