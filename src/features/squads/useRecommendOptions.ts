import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import {
  parseRecommendOptions,
  serializeRecommendOptions,
  type RecommendOptions,
} from './recommendOptions'

/** Recommendation options live in the squad page URL; changes replace the entry (no history spam). */
export function useRecommendOptions() {
  const [params, setParams] = useSearchParams()
  const key = params.toString()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-parse only when the query string changes
  const options = useMemo(() => parseRecommendOptions(params), [key])
  const update = useCallback(
    (changes: Partial<RecommendOptions>) =>
      setParams(serializeRecommendOptions({ ...options, ...changes }), {
        replace: true,
        preventScrollReset: true,
      }),
    [options, setParams],
  )
  return { options, update }
}
