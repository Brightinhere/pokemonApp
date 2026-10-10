import { createContext, useContext } from 'react'

export const AnnouncerContext = createContext<(message: string) => void>(() => {})

/** Announces a short message to screen readers through the app's polite live region. */
export const useAnnounce = () => useContext(AnnouncerContext)
