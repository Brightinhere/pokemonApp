import type { PokemonEntry } from '../../data/types'
import { warningsFor } from './squadRules'

export function SquadWarnings({
  members,
  speciesName,
}: {
  members: PokemonEntry[]
  speciesName: (speciesId: number) => string
}) {
  const warnings = warningsFor(members, speciesName)
  if (warnings.length === 0) return null
  return (
    <ul aria-label="Warnings" className="mb-8 grid gap-2">
      {warnings.map((warning) => (
        <li
          key={warning.kind === 'duplicate-species' ? `dup-${warning.speciesName}` : 'megas'}
          className="max-w-[72ch] border-l-4 border-ink bg-panel px-4 py-2.5"
        >
          {warning.kind === 'duplicate-species'
            ? `${warning.speciesName} appears more than once. That's allowed here, but most battle formats only let you bring one of each species.`
            : `This squad has ${warning.count} Mega forms. Only one Mega Evolution can be used in a battle.`}
        </li>
      ))}
    </ul>
  )
}
