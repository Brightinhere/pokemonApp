import { Link } from 'react-router'
import type { PokemonEntry } from '../../data/types'
import { useGetPokemonQuery } from '../../services/pokeApi'
import { Toggle } from '../../ui'
import { cosmeticFormLabel } from './shape'

const linkClass = (current: boolean) =>
  `rounded-chip border-[1.5px] px-2.5 py-1.5 text-sm leading-none font-semibold font-stretch-condensed no-underline ${
    current ? 'border-ink bg-ink text-panel' : 'border-rule-strong text-ink hover:border-ink'
  }`

interface FormsSwitcherProps {
  entry: PokemonEntry
  /** Every index entry of the species, in list order. */
  speciesEntries: PokemonEntry[]
  cosmeticForm: string | null
  onCosmeticForm: (slug: string | null) => void
}

/** Battle-relevant forms are links; cosmetic forms only change the artwork shown. */
export function FormsSwitcher({
  entry,
  speciesEntries,
  cosmeticForm,
  onCosmeticForm,
}: FormsSwitcherProps) {
  const { data } = useGetPokemonQuery(entry.name)
  const cosmetic = data?.cosmeticForms ?? []
  if (speciesEntries.length < 2 && cosmetic.length < 2) return null

  return (
    <nav aria-label="Forms" className="grid gap-3">
      {speciesEntries.length > 1 && (
        <ul className="flex flex-wrap gap-1.5">
          {speciesEntries.map((form) => (
            <li key={form.id}>
              <Link
                to={`/pokemon/${form.name}`}
                aria-current={form.id === entry.id ? 'page' : undefined}
                className={linkClass(form.id === entry.id)}
              >
                {form.displayName}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {cosmetic.length > 1 && (
        <div>
          <p className="mb-1.5 text-sm font-semibold">Appearance</p>
          <ul className="flex flex-wrap gap-1.5">
            {cosmetic.map((slug, i) => {
              const isDefaultLook = i === 0
              const pressed = isDefaultLook ? cosmeticForm === null : cosmeticForm === slug
              return (
                <li key={slug}>
                  <Toggle
                    pressed={pressed}
                    onPressedChange={() => onCosmeticForm(isDefaultLook ? null : slug)}
                  >
                    {cosmeticFormLabel(slug, entry.name)}
                  </Toggle>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </nav>
  )
}
