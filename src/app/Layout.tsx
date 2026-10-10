import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { SquadTray } from '../features/squads/SquadTray'
import { usePruneSquads } from '../features/squads/usePruneSquads'
import { Announcer } from './Announcer'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-2 py-2 min-[480px]:px-3 ${isActive ? 'font-bold text-ink shadow-[inset_0_-3px_0_var(--color-ink)]' : 'text-ink-soft hover:text-ink'}`

export function Layout() {
  usePruneSquads()
  // Detail pages belong to the Pokédex, so its nav item stays current there.
  const { pathname } = useLocation()
  const inPokedex = pathname === '/' || pathname.startsWith('/pokemon/')
  return (
    <Announcer>
      <div className="min-h-dvh">
        <header className="border-b border-rule bg-panel">
          <nav
            aria-label="Main"
            className="mx-auto flex h-16 max-w-[1200px] items-center gap-2 px-4 min-[480px]:gap-4 sm:gap-8 sm:px-6"
          >
            <span className="whitespace-nowrap text-base font-extrabold font-stretch-expanded tracking-tight min-[480px]:text-lg">
              Squad Lab
            </span>
            <div className="flex gap-1 self-stretch">
              <Link
                to="/"
                aria-current={inPokedex ? 'page' : undefined}
                className={`${navLinkClass({ isActive: inPokedex })} flex items-center`}
              >
                Pokédex
              </Link>
              <NavLink
                to="/squads"
                className={(state) => `${navLinkClass(state)} flex items-center`}
              >
                Squads
              </NavLink>
            </div>
            <SquadTray />
          </nav>
        </header>
        <main className="mx-auto max-w-[1200px] px-4 pt-6 pb-16 sm:px-6 sm:pt-8">
          <Outlet />
        </main>
      </div>
    </Announcer>
  )
}
