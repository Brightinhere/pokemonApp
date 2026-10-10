import { describe, expect, test } from 'vitest'
import abilitySolarPower from './fixtures/ability-solar-power.json'
import chainCharizard from './fixtures/evolution-chain-2.json'
import chainEevee from './fixtures/evolution-chain-67.json'
import pokemonCharizard from './fixtures/pokemon-charizard.json'
import formPolar from './fixtures/pokemon-form-vivillon-polar.json'
import pokemonVivillon from './fixtures/pokemon-vivillon.json'
import species6 from './fixtures/species-6.json'
import {
  cleanFlavorText,
  cosmeticFormLabel,
  formatEvolutionCondition,
  pickEnglish,
  shapeAbility,
  shapePokemon,
  shapePokemonForm,
  shapeSpecies,
  toEvolutionTree,
  type RawAbility,
  type RawEvolutionChain,
  type RawEvolutionDetail,
  type RawPokemon,
  type RawPokemonForm,
  type RawSpecies,
} from './shape'

const levelUp = (fields: Record<string, unknown>): RawEvolutionDetail => ({
  trigger: { name: 'level-up', url: '' },
  ...fields,
})
const resource = (name: string) => ({ name, url: '' })

describe('cleanFlavorText', () => {
  test('joins game text-box lines into one paragraph', () => {
    expect(cleanFlavorText('Spits fire that\nis hot enough\fto melt  boulders.\n')).toBe(
      'Spits fire that is hot enough to melt boulders.',
    )
  })

  test('removes soft hyphens that split words across lines', () => {
    expect(cleanFlavorText('evolu­\ntion')).toBe('evolution')
  })
})

describe('pickEnglish', () => {
  test('takes the most recent English entry', () => {
    const entries = [
      { text: 'old', language: resource('en') },
      { text: 'ja', language: resource('ja') },
      { text: 'new', language: resource('en') },
      { text: 'de', language: resource('de') },
    ]
    expect(pickEnglish(entries)?.text).toBe('new')
    expect(pickEnglish([{ language: resource('ja') }])).toBeUndefined()
  })
})

describe('formatEvolutionCondition', () => {
  test.each([
    ['level', levelUp({ min_level: 16 }), 'Level 16'],
    ['item', { trigger: resource('use-item'), item: resource('water-stone') }, 'Water Stone'],
    ['trade', { trigger: resource('trade') }, 'Trade'],
    [
      'trade with item',
      { trigger: resource('trade'), held_item: resource('metal-coat') },
      'Trade holding Metal Coat',
    ],
    [
      'friendship by day',
      levelUp({ min_happiness: 160, time_of_day: 'day' }),
      'Friendship, during the day',
    ],
    [
      'friendship at night',
      levelUp({ min_happiness: 160, time_of_day: 'night' }),
      'Friendship, at night',
    ],
    [
      'move type',
      levelUp({ known_move_type: resource('fairy'), min_affection: 2 }),
      'Friendship, knowing a Fairy move',
    ],
    [
      'special rock',
      levelUp({ location: resource('eterna-forest'), near_special_rock: true }),
      'Level up near a special rock',
    ],
    ['plain level up', levelUp({}), 'Level up'],
  ] as const)('%s', (_, detail, expected) => {
    expect(formatEvolutionCondition(detail as RawEvolutionDetail)).toBe(expected)
  })

  test.each([
    ['unknown trigger', { trigger: resource('three-critical-hits') }],
    ['unhandled field', levelUp({ min_level: 20, gender: 1 })],
    ['location without a rock', levelUp({ location: resource('mt-coronet') })],
    ['missing detail', undefined],
  ])('falls back to "Special condition": %s', (_, detail) => {
    expect(formatEvolutionCondition(detail as RawEvolutionDetail | undefined)).toBe(
      'Special condition',
    )
  })

  test('ignores bookkeeping fields', () => {
    expect(
      formatEvolutionCondition(
        levelUp({
          min_level: 36,
          is_default: true,
          version_group: resource('red-blue'),
          required_pokemon_form: null,
        }),
      ),
    ).toBe('Level 36')
  })
})

describe('toEvolutionTree', () => {
  test('a linear chain (Charmander)', () => {
    const tree = toEvolutionTree((chainCharizard as RawEvolutionChain).chain)
    expect(tree).toMatchObject({ speciesId: 4, speciesName: 'charmander', condition: null })
    const charmeleon = tree.children[0]!
    expect(charmeleon).toMatchObject({ speciesId: 5, condition: 'Level 16' })
    expect(charmeleon.children[0]).toMatchObject({
      speciesId: 6,
      speciesName: 'charizard',
      condition: 'Level 36',
    })
  })

  test("Eevee's eight branches", () => {
    const tree = toEvolutionTree((chainEevee as RawEvolutionChain).chain)
    expect(tree.speciesName).toBe('eevee')
    const branches = Object.fromEntries(tree.children.map((c) => [c.speciesName, c.condition]))
    expect(Object.keys(branches)).toHaveLength(8)
    expect(branches.vaporeon).toBe('Water Stone')
    expect(branches.espeon).toBe('Friendship, during the day')
    expect(branches.umbreon).toBe('Friendship, at night')
    // Newer games replaced the special rocks with stones; the most recent method wins.
    expect(branches.leafeon).toBe('Leaf Stone')
    expect(branches.glaceon).toBe('Ice Stone')
    expect(branches.sylveon).toBe('Friendship, knowing a Fairy move')
  })
})

describe('response shapes', () => {
  test('pokemon: abilities in order with the hidden one marked, no cosmetic forms for Charizard', () => {
    expect(shapePokemon(pokemonCharizard as RawPokemon)).toEqual({
      abilities: [
        { name: 'blaze', isHidden: false },
        { name: 'solar-power', isHidden: true },
      ],
      cosmeticForms: [],
    })
  })

  test('pokemon: Vivillon has 20 cosmetic forms', () => {
    const { cosmeticForms } = shapePokemon(pokemonVivillon as RawPokemon)
    expect(cosmeticForms).toHaveLength(20)
    expect(cosmeticForms).toContain('vivillon-polar')
    expect(cosmeticFormLabel('vivillon-icy-snow', 'vivillon')).toBe('Icy Snow')
    expect(cosmeticFormLabel('vivillon-meadow', 'vivillon')).toBe('Meadow')
  })

  test('species: cleaned English flavor text and chain id', () => {
    const shaped = shapeSpecies(species6 as RawSpecies)
    expect(shaped.evolutionChainId).toBe(2)
    expect(shaped.flavorText).toBe(
      'Its wings can carry this Pokémon close to an altitude of 4,600 feet. It blows out fire at very high temperatures.',
    )
  })

  test('ability: English name and in-game description', () => {
    expect(shapeAbility(abilitySolarPower as RawAbility)).toEqual({
      displayName: 'Solar Power',
      description:
        "In harsh sunlight, the Pokémon's Sp. Atk stat is boosted, but its HP decreases every turn.",
    })
  })

  test('ability: falls back to the short effect, then to nothing', () => {
    const base = abilitySolarPower as RawAbility
    expect(shapeAbility({ ...base, flavor_text_entries: [] }).description).toMatch(
      /^Increases Special Attack/,
    )
    expect(
      shapeAbility({ ...base, flavor_text_entries: [], effect_entries: [] }).description,
    ).toBeNull()
  })

  test('pokemon form: English form name and sprite', () => {
    expect(shapePokemonForm(formPolar as RawPokemonForm)).toEqual({
      displayName: 'Polar Pattern',
      sprite:
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/666-polar.png',
    })
  })
})
