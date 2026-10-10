import type { RawPokemon, RawTypeEfficacy } from './queries'

const ART =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork'

interface FixtureOptions {
  id: number
  name: string
  speciesId: number
  isDefault: boolean
  types: string[]
  formName?: string
  isMega?: boolean
  isBattleOnly?: boolean
  formGeneration?: number | null
  speciesGeneration: number
  formDisplayName?: string | null
  speciesName: string
  isLegendary?: boolean
}

/** Builds a raw GraphQL `pokemon` row shaped like the real API response. */
export function rawPokemon(o: FixtureOptions): RawPokemon {
  return {
    id: o.id,
    name: o.name,
    is_default: o.isDefault,
    pokemon_species_id: o.speciesId,
    pokemontypes: o.types.map((name) => ({ type: { name } })),
    pokemonstats: [
      ['hp', 78],
      ['attack', 84],
      ['defense', 78],
      ['special-attack', 109],
      ['special-defense', 85],
      ['speed', 100],
    ].map(([name, base_stat]) => ({
      base_stat: base_stat as number,
      stat: { name: name as string },
    })),
    pokemonsprites: [
      {
        sprites: {
          front_default: null,
          other: { 'official-artwork': { front_default: `${ART}/${o.id}.png` } },
        },
      },
    ],
    pokemonforms: [
      {
        form_name: o.formName ?? '',
        is_mega: o.isMega ?? false,
        is_battle_only: o.isBattleOnly ?? false,
        versiongroup:
          o.formGeneration === null
            ? null
            : { generation_id: o.formGeneration ?? o.speciesGeneration },
        pokemonformnames:
          o.formDisplayName === undefined ? [] : [{ pokemon_name: o.formDisplayName }],
      },
    ],
    pokemonspecy: {
      generation_id: o.speciesGeneration,
      is_legendary: o.isLegendary ?? false,
      is_mythical: false,
      pokemonspeciesnames: [{ name: o.speciesName }],
    },
  }
}

export const charizard = rawPokemon({
  id: 6,
  name: 'charizard',
  speciesId: 6,
  isDefault: true,
  types: ['fire', 'flying'],
  speciesGeneration: 1,
  speciesName: 'Charizard',
  formDisplayName: null,
})
export const charizardMegaX = rawPokemon({
  id: 10034,
  name: 'charizard-mega-x',
  speciesId: 6,
  isDefault: false,
  types: ['fire', 'dragon'],
  formName: 'mega-x',
  isMega: true,
  isBattleOnly: true,
  formGeneration: 6,
  speciesGeneration: 1,
  speciesName: 'Charizard',
  formDisplayName: 'Mega Charizard X',
})
export const charizardGmax = rawPokemon({
  id: 10196,
  name: 'charizard-gmax',
  speciesId: 6,
  isDefault: false,
  types: ['fire', 'flying'],
  formName: 'gmax',
  isBattleOnly: true,
  formGeneration: 8,
  speciesGeneration: 1,
  speciesName: 'Charizard',
  formDisplayName: 'Gigantamax Charizard',
})
export const vulpixAlola = rawPokemon({
  id: 10103,
  name: 'vulpix-alola',
  speciesId: 37,
  isDefault: false,
  types: ['ice'],
  formName: 'alola',
  formGeneration: 7,
  speciesGeneration: 1,
  speciesName: 'Vulpix',
  formDisplayName: 'Alolan Vulpix',
})
export const rotomWash = rawPokemon({
  id: 10009,
  name: 'rotom-wash',
  speciesId: 479,
  isDefault: false,
  types: ['electric', 'water'],
  formName: 'wash',
  formGeneration: 4,
  speciesGeneration: 4,
  speciesName: 'Rotom',
  formDisplayName: 'Wash Rotom',
})
export const darmanitanGalarZen = rawPokemon({
  id: 10178,
  name: 'darmanitan-galar-zen',
  speciesId: 555,
  isDefault: false,
  types: ['ice', 'fire'],
  formName: 'galar-zen',
  isBattleOnly: true,
  formGeneration: 8,
  speciesGeneration: 5,
  speciesName: 'Darmanitan',
  formDisplayName: 'Zen Galarian Darmanitan',
})
/** Vivillon is one `pokemon`; its 20 patterns are cosmetic `pokemon-form`s and never entries. */
export const vivillon = rawPokemon({
  id: 666,
  name: 'vivillon',
  speciesId: 666,
  isDefault: true,
  types: ['bug', 'flying'],
  formName: 'meadow',
  speciesGeneration: 6,
  speciesName: 'Vivillon',
  formDisplayName: 'Meadow Vivillon',
})

export const efficacy = (
  attacker: [number, string],
  defender: [number, string],
  factor: number,
): RawTypeEfficacy => ({
  damage_factor: factor,
  type: { id: attacker[0], name: attacker[1] },
  TypeByTargetTypeId: { id: defender[0], name: defender[1] },
})
