export const GRAPHQL_ENDPOINT = 'https://graphql.pokeapi.co/v1beta2'

const USER_AGENT = 'pokemon-app-data-build (personal project; runs a few queries per release)'

export type FetchFn = typeof fetch

/** POSTs one GraphQL query and returns `data`, throwing on HTTP or GraphQL errors. */
export async function queryGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  fetchFn: FetchFn = fetch,
): Promise<T> {
  const response = await fetchFn(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
    body: JSON.stringify({ query, variables }),
  })
  if (!response.ok) {
    throw new Error(`PokeAPI GraphQL responded with HTTP ${response.status}`)
  }
  const body = (await response.json()) as { data?: T; errors?: { message: string }[] }
  if (body.errors?.length) {
    throw new Error(`PokeAPI GraphQL error: ${body.errors.map((e) => e.message).join('; ')}`)
  }
  if (!body.data) throw new Error('PokeAPI GraphQL response had no data')
  return body.data
}
