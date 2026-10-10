import { useEffect, useId, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { retryPokemonIndex, usePokemonIndex } from '../../data/pokemonIndex'
import { Button } from '../../ui'
import { CopyShareLink } from './CopyShareLink'
import { MemberSlots } from './MemberSlots'
import { SquadAnalysis } from './SquadAnalysis'
import { MAX_NAME_LENGTH, normalizeName } from './squadRules'
import {
  deleteSquad,
  moveMember,
  removeMember,
  renameSquad,
  selectSquads,
  setCurrentSquad,
  type Squad,
} from './squadsSlice'
import { SquadWarnings } from './SquadWarnings'
import { useEntryLookup } from './useSquadEntries'

export function SquadPage() {
  const { id = '' } = useParams<'id'>()
  const squad = useAppSelector(selectSquads).find((s) => s.id === id)
  const dispatch = useAppDispatch()

  // Opening a squad makes it the current one.
  useEffect(() => {
    if (squad) dispatch(setCurrentSquad({ id: squad.id }))
  }, [squad?.id, dispatch]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!squad) {
    return (
      <section>
        <title>Squad not found | Squad Lab</title>
        <h1 className="mb-2 text-2xl font-extrabold font-stretch-expanded">Squad not found</h1>
        <p className="mb-4 text-ink-soft">
          This squad doesn&apos;t exist in this browser. It may have been deleted.
        </p>
        <Link to="/squads" className="underline underline-offset-3">
          Go to your squads
        </Link>
      </section>
    )
  }
  return <SquadView key={squad.id} squad={squad} />
}

function SquadName({ squad }: { squad: Squad }) {
  const dispatch = useAppDispatch()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(squad.name)
  const [error, setError] = useState<string | null>(null)
  const inputId = useId()

  if (!editing) {
    return (
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-extrabold font-stretch-expanded tracking-tight break-words">
          {squad.name}
        </h1>
        <Button
          onClick={() => {
            setDraft(squad.name)
            setError(null)
            setEditing(true)
          }}
        >
          Rename
        </Button>
      </div>
    )
  }
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (!normalizeName(draft)) {
          setError(
            draft.trim()
              ? `Names can be at most ${MAX_NAME_LENGTH} characters.`
              : "The name can't be empty.",
          )
          return
        }
        dispatch(renameSquad({ id: squad.id, name: draft }))
        setEditing(false)
      }}
    >
      <label htmlFor={inputId} className="text-sm font-semibold">
        Squad name
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id={inputId}
          autoFocus
          value={draft}
          maxLength={MAX_NAME_LENGTH + 10}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          onChange={(event) => setDraft(event.target.value)}
          className="min-w-0 flex-1 rounded-panel border-[1.5px] border-rule-strong bg-panel px-3 py-2 text-lg text-ink"
        />
        <Button type="submit" variant="primary">
          Save name
        </Button>
        <Button onClick={() => setEditing(false)}>Cancel</Button>
      </div>
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-sm font-semibold">
          {error}
        </p>
      )}
    </form>
  )
}

function DeleteSquad({ squad }: { squad: Squad }) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  if (!confirming) return <Button onClick={() => setConfirming(true)}>Delete squad</Button>
  return (
    <div role="group" aria-label="Confirm delete" className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold">Delete {squad.name}?</span>
      <Button
        variant="primary"
        onClick={() => {
          dispatch(deleteSquad({ id: squad.id }))
          void navigate('/squads')
        }}
      >
        Yes, delete
      </Button>
      <Button onClick={() => setConfirming(false)}>Cancel</Button>
    </div>
  )
}

function SquadView({ squad }: { squad: Squad }) {
  const dispatch = useAppDispatch()
  const index = usePokemonIndex()
  const lookup = useEntryLookup()

  if (index.status === 'error') {
    return (
      <div role="alert" className="grid justify-items-start gap-3 py-12">
        <p className="text-lg font-bold font-stretch-expanded">
          The Pokémon list could not be loaded.
        </p>
        <Button onClick={() => void retryPokemonIndex()}>Try again</Button>
      </div>
    )
  }
  if (!lookup) {
    return (
      <p role="status" className="py-12 text-ink-soft">
        Loading…
      </p>
    )
  }

  const members = lookup.membersOf(squad.members)
  return (
    <article>
      <title>{`${squad.name} | Squad Lab`}</title>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <SquadName squad={squad} />
        <div className="flex flex-wrap gap-2">
          <DeleteSquad squad={squad} />
          {squad.members.length > 0 && <CopyShareLink squad={squad} />}
        </div>
      </div>
      <MemberSlots
        members={members}
        onMove={(i, direction) => dispatch(moveMember({ squadId: squad.id, index: i, direction }))}
        onRemove={(i) => dispatch(removeMember({ squadId: squad.id, index: i }))}
      />
      <SquadWarnings members={members} speciesName={lookup.speciesName} />
      <SquadAnalysis members={members} />
    </article>
  )
}
