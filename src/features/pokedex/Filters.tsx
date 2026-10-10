import { useId, useState } from 'react'
import { POKEMON_TYPES } from '../../data/types'
import { Toggle, capitalize } from '../../ui'
import {
  FORM_TOGGLES,
  MAX_GENERATION,
  MAX_TYPES,
  type FormToggle,
  type ListQuery,
} from './listQuery'

const FORM_LABELS: Record<FormToggle, string> = {
  regional: 'Regional',
  mega: 'Mega',
  gmax: 'Gigantamax',
  other: 'Other forms',
}

const fieldLabel = 'mb-1.5 block text-sm font-semibold'
const control =
  'w-full rounded-panel border-[1.5px] border-rule-strong bg-panel px-3 py-2 text-base text-ink'

interface FiltersProps {
  query: ListQuery
  update: (changes: Partial<ListQuery>, options?: { replace?: boolean }) => void
}

function SearchField({ query, update }: FiltersProps) {
  // Local text keeps typing smooth (spaces, cursor); the URL holds the trimmed value.
  const [text, setText] = useState(query.search)
  const [synced, setSynced] = useState(query.search)
  if (query.search !== synced) {
    // The URL changed from outside (back/forward, clear): follow it.
    setSynced(query.search)
    setText(query.search)
  }
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className={fieldLabel}>
        Search
      </label>
      <input
        id={id}
        type="search"
        value={text}
        placeholder="Name or number"
        autoComplete="off"
        className={control}
        onChange={(event) => {
          const value = event.target.value
          setText(value)
          setSynced(value.trim())
          update({ search: value }, { replace: true })
        }}
      />
    </div>
  )
}

export function Filters({ query, update }: FiltersProps) {
  const genId = useId()
  const typesFull = query.types.length >= MAX_TYPES

  return (
    <div className="grid gap-6">
      <SearchField query={query} update={update} />

      <fieldset>
        <legend className={fieldLabel}>Types</legend>
        <div className="flex flex-wrap gap-1.5">
          {POKEMON_TYPES.map((type) => {
            const pressed = query.types.includes(type)
            return (
              <Toggle
                key={type}
                colorType={type}
                pressed={pressed}
                disabled={!pressed && typesFull}
                onPressedChange={(next) =>
                  update({
                    types: next ? [...query.types, type] : query.types.filter((t) => t !== type),
                  })
                }
              >
                {capitalize(type)}
              </Toggle>
            )
          })}
        </div>
        <p className="mt-1.5 text-xs text-ink-soft">Pick up to two.</p>
      </fieldset>

      <div>
        <label htmlFor={genId} className={fieldLabel}>
          Generation
        </label>
        <select
          id={genId}
          className={control}
          value={query.maxGeneration ?? ''}
          onChange={(event) =>
            update({ maxGeneration: event.target.value ? Number(event.target.value) : null })
          }
        >
          <option value="">All generations</option>
          {Array.from({ length: MAX_GENERATION }, (_, i) => i + 1).map((gen) => (
            <option key={gen} value={gen}>
              Up to generation {gen}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className={fieldLabel}>Show forms</legend>
        <div className="flex flex-wrap gap-1.5">
          {FORM_TOGGLES.map((form) => (
            <Toggle
              key={form}
              pressed={query.forms.includes(form)}
              onPressedChange={(next) =>
                update({
                  forms: next ? [...query.forms, form] : query.forms.filter((f) => f !== form),
                })
              }
            >
              {FORM_LABELS[form]}
            </Toggle>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={fieldLabel}>Legendary and mythical</legend>
        <Toggle
          pressed={query.includeLegendary}
          onPressedChange={(includeLegendary) => update({ includeLegendary })}
        >
          Include
        </Toggle>
      </fieldset>
    </div>
  )
}
