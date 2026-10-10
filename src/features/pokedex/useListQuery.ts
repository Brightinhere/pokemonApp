import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { parseListQuery, serializeListQuery, type ListQuery } from './listQuery'

/** List state, read from and written to the URL (the only place it lives). */
export function useListQuery() {
  const [params, setParams] = useSearchParams()
  const key = params.toString()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-parse only when the query string changes
  const query = useMemo(() => parseListQuery(params), [key])

  const update = useCallback(
    (changes: Partial<ListQuery>, { replace = false } = {}) => {
      setParams(serializeListQuery({ ...query, ...changes }), { replace, preventScrollReset: true })
    },
    [query, setParams],
  )

  const reset = useCallback(
    () => setParams(new URLSearchParams(), { preventScrollReset: true }),
    [setParams],
  )

  return { query, update, reset }
}
