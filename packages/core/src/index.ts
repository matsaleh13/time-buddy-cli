import type { Duration } from 'luxon'
import { parse, ParseError } from './grammar/parser.js'
import { evaluate } from './eval/evaluator.js'
import { EvalError } from './eval/types.js'
import type { Value } from './eval/types.js'
import type { Node } from './grammar/ast.js'

export { parse, ParseError } from './grammar/parser.js'
export { evaluate } from './eval/evaluator.js'
export { EvalError } from './eval/types.js'
export type { Value } from './eval/types.js'
export type { Node, DurationUnit, CommandName } from './grammar/ast.js'

export interface FormatOptions {
  // How to display a duration result.
  // 'auto'    → picks the most natural representation (default)
  // 'units'   → "3d 2h 15m"
  // 'decimal' → "3.094 days"
  durationStyle?: 'auto' | 'units' | 'decimal'
  // Precision for decimal durations
  decimalPlaces?: number
}

/**
 * Parse and evaluate an expression string in one call.
 */
export function calc(input: string): Value {
  const ast = parse(input)
  return evaluate(ast)
}

/**
 * Format a Value as a human-readable string.
 */
export function format(value: Value, opts: FormatOptions = {}): string {
  const style = opts.durationStyle ?? 'auto'
  const places = opts.decimalPlaces ?? 2

  switch (value.type) {
    case 'number':
      return Number.isInteger(value.value)
        ? String(value.value)
        : value.value.toFixed(places)

    case 'datetime':
      return value.value.toISO() ?? value.value.toString()

    case 'duration':
      return style === 'decimal'
        ? formatDurationDecimal(value.value, places)
        : formatDurationUnits(value.value)
  }
}

// ---------------------------------------------------------------------------
// Duration formatting helpers
// ---------------------------------------------------------------------------

function formatDurationUnits(dur: Duration): string {
  // Normalize to a canonical set of units, dropping zeroes
  const shifted = dur.shiftTo('years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds', 'milliseconds')
  const parts: string[] = []

  const add = (v: number | undefined, unit: string, abbr: string) => {
    if (v && Math.abs(v) >= 0.001) parts.push(`${round(v)}${abbr}`)
  }

  add(shifted.years,        'years',        'y')
  add(shifted.months,       'months',       'mo')
  add(shifted.weeks,        'weeks',        'w')
  add(shifted.days,         'days',         'd')
  add(shifted.hours,        'hours',        'h')
  add(shifted.minutes,      'minutes',      'm')
  add(shifted.seconds,      'seconds',      's')
  add(shifted.milliseconds, 'milliseconds', 'ms')

  if (parts.length === 0) return '0s'

  const negative = dur.valueOf() < 0
  return (negative ? '-' : '') + parts.join(' ')
}

function formatDurationDecimal(dur: Duration, places: number): string {
  const ms = Math.abs(dur.toMillis())
  const sign = dur.toMillis() < 0 ? '-' : ''
  const units: [number, string][] = [
    [365.25 * 24 * 3600 * 1000, 'years'],
    [30.4375 * 24 * 3600 * 1000, 'months'],
    [7 * 24 * 3600 * 1000, 'weeks'],
    [24 * 3600 * 1000, 'days'],
    [3600 * 1000, 'hours'],
    [60 * 1000, 'minutes'],
    [1000, 'seconds'],
    [1, 'milliseconds'],
  ]
  for (const [divisor, label] of units) {
    if (ms >= divisor) {
      return `${sign}${(ms / divisor).toFixed(places)} ${label}`
    }
  }
  return `${sign}0 milliseconds`
}

function round(n: number): number | string {
  return Number.isInteger(n) ? n : parseFloat(n.toFixed(3))
}
