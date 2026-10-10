import chart from './typechart.json'
import type { TypeChart } from './types'

/** The 18x18 type chart, `typeChart[attacker][defender]`. Small, so imported statically. */
export const typeChart = chart as TypeChart
