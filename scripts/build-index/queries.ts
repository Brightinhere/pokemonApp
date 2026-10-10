import { queryGraphQL, type FetchFn } from './graphql'

const ENGLISH = 9
const PAGE_SIZE = 500

export interface RawPokemon {
  id: number
  name: string
  is_default: boolean
  pokemon_species_id: number
  pokemontypes: { type: { name: string } }[]
  pokemonstats: { base_stat: number; stat: { name: string } }[]
  pokemonsprites: { sprites: RawSprites | string }[]
  pokemonforms: {
    form_name: string
    is_mega: boolean
    is_battle_only: boolean
    versiongroup: { generation_id: number } | null
    pokemonformnames: { pokemon_name: string | null }[]
  }[]
  pokemonspecy: {
    generation_id: number
    is_legendary: boolean
    is_mythical: boolean
    pokemonspeciesnames: { name: string }[]
  }
}

export interface RawSprites {
  front_default?: string | null
  other?: { 'official-artwork'?: { front_default?: string | null } }
}

export interface RawTypeEfficacy {
  damage_factor: number
  type: { id: number; name: string }
  TypeByTargetTypeId: { id: number; name: string }
}

const POKEMON_QUERY = `
query Pokemon($limit: Int!, $offset: Int!) {
  pokemon(order_by: { id: asc }, limit: $limit, offset: $offset) {
    id
    name
    is_default
    pokemon_species_id
    pokemontypes(order_by: { slot: asc }) { type { name } }
    pokemonstats { base_stat stat { name } }
    pokemonsprites { sprites }
    pokemonforms(where: { is_default: { _eq: true } }) {
      form_name
      is_mega
      is_battle_only
      versiongroup { generation_id }
      pokemonformnames(where: { language_id: { _eq: ${ENGLISH} } }) { pokemon_name }
    }
    pokemonspecy {
      generation_id
      is_legendary
      is_mythical
      pokemonspeciesnames(where: { language_id: { _eq: ${ENGLISH} } }) { name }
    }
  }
}`

const COUNT_QUERY = `query { pokemon_aggregate { aggregate { count } } }`

const TYPE_EFFICACY_QUERY = `
query {
  typeefficacy(order_by: [{ damage_type_id: asc }, { target_type_id: asc }]) {
    damage_factor
    type { id name }
    TypeByTargetTypeId { id name }
  }
}`

export async function fetchPokemonCount(fetchFn?: FetchFn): Promise<number> {
  const data = await queryGraphQL<{ pokemon_aggregate: { aggregate: { count: number } } }>(
    COUNT_QUERY,
    {},
    fetchFn,
  )
  return data.pokemon_aggregate.aggregate.count
}

/** Fetches every `pokemon` resource in pages of PAGE_SIZE. */
export async function fetchAllPokemon(fetchFn?: FetchFn): Promise<RawPokemon[]> {
  const all: RawPokemon[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { pokemon } = await queryGraphQL<{ pokemon: RawPokemon[] }>(
      POKEMON_QUERY,
      { limit: PAGE_SIZE, offset },
      fetchFn,
    )
    all.push(...pokemon)
    if (pokemon.length < PAGE_SIZE) return all
  }
}

export async function fetchTypeEfficacy(fetchFn?: FetchFn): Promise<RawTypeEfficacy[]> {
  const data = await queryGraphQL<{ typeefficacy: RawTypeEfficacy[] }>(
    TYPE_EFFICACY_QUERY,
    {},
    fetchFn,
  )
  return data.typeefficacy
}
