import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AnnouncerContext } from './announcerContext'

/** One polite live region for the whole app; also shown briefly as a visible confirmation. */
export function Announcer({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState({ text: '', id: 0 })
  const announce = useCallback(
    (text: string) => setMessage((prev) => ({ text, id: prev.id + 1 })),
    [],
  )

  // Hide the visible confirmation after a few seconds; screen readers have already announced it.
  useEffect(() => {
    if (!message.text) return
    const timer = setTimeout(() => setMessage((prev) => ({ ...prev, text: '' })), 4000)
    return () => clearTimeout(timer)
  }, [message])
  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <p
        role="status"
        aria-live="polite"
        data-testid="announcer"
        className={`fixed bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-panel bg-ink px-4 py-2.5 text-sm font-semibold text-panel ${
          message.text ? '' : 'sr-only'
        }`}
      >
        {/* Keyed so repeating the same message is announced again. */}
        <span key={message.id}>{message.text}</span>
      </p>
    </AnnouncerContext.Provider>
  )
}
