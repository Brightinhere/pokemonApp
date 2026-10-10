import { memo } from 'react'
import { Link } from 'react-router'
import type { PokemonEntry } from '../../data/types'
import { DexNumber, PokemonArt, StatBar, TypeList, formLabel } from '../../ui'
import { baseStatTotal } from './listQuery'

export const PokemonRow = memo(function PokemonRow({ entry }: { entry: PokemonEntry }) {
  const total = baseStatTotal(entry.stats)
  const label = formLabel(entry)
  return (
    <li
      className={`grid grid-cols-[48px_minmax(0,1fr)] items-center gap-x-4 gap-y-1 border-t border-rule px-4 py-2 [contain-intrinsic-size:auto_72px] [content-visibility:auto] first:border-t-0 md:grid-cols-[56px_64px_minmax(0,1fr)_200px_128px] ${
        entry.isDefault ? '' : 'bg-paper/55'
      }`}
    >
      <PokemonArt
        src={entry.sprite}
        size={56}
        className="row-span-2 max-md:size-12 md:row-span-1"
      />
      <DexNumber speciesId={entry.speciesId} className="hidden md:block" />
      <span className={`min-w-0 ${entry.isDefault ? '' : 'md:pl-4'}`}>
        <Link
          to={`/pokemon/${entry.name}`}
          state={{ fromList: true }}
          className={`block truncate leading-tight font-bold font-stretch-expanded hover:underline hover:underline-offset-3 ${
            entry.isDefault ? 'text-lg' : 'text-base'
          }`}
        >
          {entry.displayName}
        </Link>
        {label && (
          <span className="block text-xs font-semibold text-ink-soft font-stretch-condensed">
            {label}
          </span>
        )}
      </span>
      <TypeList types={entry.types} />
      <span
        className="hidden grid-cols-[32px_1fr] items-center gap-2 text-sm font-semibold md:grid"
        title="Total base stats"
      >
        <span>{total}</span>
        <StatBar value={total} max={720} />
      </span>
    </li>
  )
})
