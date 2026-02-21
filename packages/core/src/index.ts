import type { DateTime, Duration } from 'luxon'
import { parse, ParseError } from './grammar/parser.js'
import { evaluate } from './eval/evaluator.js'
import { EvalError, PRECISION_RANK } from './eval/types.js'
import type { Value, Precision } from './eval/types.js'
import type { Node } from './grammar/ast.js'

export { parse, ParseError } from './grammar/parser.js'
export { evaluate } from './eval/evaluator.js'
export { EvalError } from './eval/types.js'
export type { Value, Precision } from './eval/types.js'
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
 * Datetime and duration results are automatically formatted at the precision
 * implied by the inputs (e.g. `date + 30d` shows only the date; `1h + 30m` shows hours and minutes).
 */
export function format(value: Value, opts: FormatOptions = {}): string {
  const style  = opts.durationStyle ?? 'auto'
  const places = opts.decimalPlaces ?? 2

  switch (value.type) {
    case 'number':
      return Number.isInteger(value.value)
        ? String(value.value)
        : value.value.toFixed(places)

    case 'datetime':
      return formatDatetime(value.value, value.precision)

    case 'duration':
      return style === 'decimal'
        ? formatDurationDecimal(value.value, places)
        : formatDurationUnits(value.value, value.precision)
  }
}

// ---------------------------------------------------------------------------
// Datetime formatting
// ---------------------------------------------------------------------------

function formatDatetime(dt: DateTime, precision: Precision): string {
  switch (precision) {
    case 'day':         return dt.toFormat('yyyy-MM-dd')
    case 'hour':
    case 'minute':      return dt.toFormat('yyyy-MM-dd HH:mm')
    case 'second':      return dt.toFormat('yyyy-MM-dd HH:mm:ss')
    case 'millisecond': return dt.toFormat('yyyy-MM-dd HH:mm:ss.SSS')
  }
}

// ---------------------------------------------------------------------------
// Duration formatting helpers
// ---------------------------------------------------------------------------

// Each duration unit's coarseness rank (0 = finest, 4 = coarsest).
// years/months/weeks are "day-level" because sub-day units don't apply to them.
const DUR_UNIT_RANK: Record<string, number> = {
  milliseconds: 0,
  seconds:      1,
  minutes:      2,
  hours:        3,
  days:         4,
  weeks:        4,
  months:       4,
  years:        4,
}

function formatDurationUnits(dur: Duration, precision: Precision): string {
  const cutoff = PRECISION_RANK[precision]
  const shifted = dur.shiftTo('years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds', 'milliseconds')
  const parts: string[] = []

  // Only include units that are at least as coarse as the precision cutoff.
  const add = (v: number | undefined, durUnit: string, abbr: string) => {
    if (DUR_UNIT_RANK[durUnit] >= cutoff && v && Math.abs(v) >= 0.001) {
      parts.push(`${round(v)}${abbr}`)
    }
  }

  add(shifted.years,        'years',        'y')
  add(shifted.months,       'months',       'mo')
  add(shifted.weeks,        'weeks',        'w')
  add(shifted.days,         'days',         'd')
  add(shifted.hours,        'hours',        'h')
  add(shifted.minutes,      'minutes',      'm')
  add(shifted.seconds,      'seconds',      's')
  add(shifted.milliseconds, 'milliseconds', 'ms')

  if (parts.length === 0) {
    // Show a zero in the finest unit allowed at this precision
    const zeroUnit: Record<Precision, string> = {
      day: '0d', hour: '0h', minute: '0m', second: '0s', millisecond: '0ms',
    }
    return zeroUnit[precision]
  }

  const negative = dur.valueOf() < 0
  return (negative ? '-' : '') + parts.join(' ')
}

function formatDurationDecimal(dur: Duration, places: number): string {
  const ms   = Math.abs(dur.toMillis())
  const sign = dur.toMillis() < 0 ? '-' : ''
  const units: [number, string][] = [
    [365.25 * 24 * 3600 * 1000,    'years'],
    [30.4375 * 24 * 3600 * 1000,   'months'],
    [7 * 24 * 3600 * 1000,         'weeks'],
    [24 * 3600 * 1000,             'days'],
    [3600 * 1000,                  'hours'],
    [60 * 1000,                    'minutes'],
    [1000,                         'seconds'],
    [1,                            'milliseconds'],
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
