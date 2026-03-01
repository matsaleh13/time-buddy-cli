import type { DateTime, Duration } from 'luxon'
import { parse, ParseError } from './grammar/parser.js'
import { evaluate } from './eval/evaluator.js'
import { EvalError, PRECISION_RANK } from './eval/types.js'
import type { Value, Precision } from './eval/types.js'
import type { Node, DurationUnit } from './grammar/ast.js'

export { parse, ParseError } from './grammar/parser.js'
export { evaluate } from './eval/evaluator.js'
export { EvalError } from './eval/types.js'
export type { Value, Precision, DatetimeValue } from './eval/types.js'
export type { Node, DurationUnit, CommandName } from './grammar/ast.js'

export interface FormatOptions {
  // How to display a duration result.
  // 'auto'    → picks the most natural representation (default)
  // 'units'   → "3d 2h 15m"
  // 'decimal' → "3.09 days" (picks the largest fitting unit)
  durationStyle?: 'auto' | 'units' | 'decimal'
  // Express the duration in a specific unit: "1.50 hours", "99.00 days"
  // Takes precedence over durationStyle when set.
  durationUnit?: DurationUnit
  // Decimal places for numeric/decimal-duration output (default: 2)
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
      if (opts.durationUnit) return formatDurationInUnit(value.value, opts.durationUnit, places)
      return style === 'decimal'
        ? formatDurationDecimal(value.value, places)
        : formatDurationUnits(value.value, value.precision)

    case 'list':
      if (value.items.length === 0) return '(no results)'
      return value.items.map(item => format(item, opts)).join('\n')
  }
}

/**
 * Return a plain JSON-serialisable object representing a Value.
 * Suitable for piping to other tools via `tb --json`.
 */
export function toJSON(value: Value, opts: FormatOptions = {}): object {
  switch (value.type) {
    case 'number':
      return { type: 'number', value: value.value }
    case 'datetime':
      return {
        type: 'datetime',
        value: format(value, opts),
        iso: value.value.toISO(),
        unix: Math.floor(value.value.toMillis() / 1000),
      }
    case 'duration':
      return {
        type: 'duration',
        value: format(value, opts),
        milliseconds: value.value.toMillis(),
      }
    case 'list':
      return {
        type: 'list',
        count: value.items.length,
        items: value.items.map(item => format(item, opts)),
      }
  }
}

// ---------------------------------------------------------------------------
// Datetime formatting
// ---------------------------------------------------------------------------

function formatDatetime(dt: DateTime, precision: Precision): string {
  const tz = tzSuffix(dt)
  switch (precision) {
    case 'day':         return dt.toFormat('yyyy-MM-dd') + tz
    case 'hour':
    case 'minute':      return dt.toFormat('yyyy-MM-dd HH:mm') + tz
    case 'second':      return dt.toFormat('yyyy-MM-dd HH:mm:ss') + tz
    case 'millisecond': return dt.toFormat('yyyy-MM-dd HH:mm:ss.SSS') + tz
  }
}

/** Returns a timezone suffix for datetimes with an explicit fixed-offset zone.
 *  System (local) and IANA zones get no suffix. */
function tzSuffix(dt: DateTime): string {
  if (dt.zone.type !== 'fixed') return ''
  if (dt.offset === 0) return 'Z'
  return dt.toFormat('ZZ')  // e.g. "+05:30"
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

/** Convert a duration to a specific unit and display as a decimal. */
function formatDurationInUnit(dur: Duration, unit: DurationUnit, places: number): string {
  const MS_PER: Record<DurationUnit, number> = {
    milliseconds: 1,
    seconds:      1_000,
    minutes:      60 * 1_000,
    hours:        3_600 * 1_000,
    days:         86_400 * 1_000,
    weeks:        7 * 86_400 * 1_000,
    months:       30.4375 * 86_400 * 1_000,
    years:        365.25 * 86_400 * 1_000,
  }
  const sign = dur.toMillis() < 0 ? '-' : ''
  const result = Math.abs(dur.toMillis()) / MS_PER[unit]
  return `${sign}${result.toFixed(places)} ${unit}`
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
