import { createTypeEngine } from '../engine'
import { typeChart } from './typeChart'

/** The type engine bound to the committed modern chart. Import this from app code. */
export const typeEngine = createTypeEngine(typeChart)
