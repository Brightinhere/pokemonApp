import { useEffect, useId, useRef, useState } from 'react'
import { useAnnounce } from '../../app/announcerContext'
import { Button } from '../../ui'
import { buildSharePath } from './shareLink'
import type { Squad } from './squadsSlice'

/** Copies the squad's share link; falls back to a selectable field when the clipboard is unavailable. */
export function CopyShareLink({ squad }: { squad: Squad }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'manual'>('idle')
  const announce = useAnnounce()
  const fieldRef = useRef<HTMLInputElement>(null)
  const fieldId = useId()
  const url = `${window.location.origin}${buildSharePath(squad.name, squad.members)}`

  useEffect(() => {
    if (status === 'manual') fieldRef.current?.select()
  }, [status])

  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(url)
      setStatus('copied')
      announce('Link copied')
    } catch {
      setStatus('manual')
    }
  }

  return (
    <div className="grid justify-items-end gap-2">
      <Button variant="primary" onClick={() => void copy()}>
        {status === 'copied' ? 'Link copied' : 'Copy share link'}
      </Button>
      {status === 'manual' && (
        <div className="grid w-full max-w-md gap-1">
          <label htmlFor={fieldId} className="text-sm font-semibold">
            Copy this link to share the squad
          </label>
          <input
            id={fieldId}
            ref={fieldRef}
            readOnly
            value={url}
            onFocus={(event) => event.currentTarget.select()}
            className="w-full rounded-panel border-[1.5px] border-rule-strong bg-panel px-3 py-2 text-sm text-ink"
          />
        </div>
      )}
    </div>
  )
}
