import * as ohm from 'ohm-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import type { Node, DurationUnit, CalendarUnit, RelativeDirection, Weekday } from './ast.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const grammarSource = readFileSync(join(__dirname, 'tb.ohm'), 'utf-8')
const grammar = ohm.grammar(grammarSource)

const semantics = grammar.createSemantics()

semantics.addOperation<Node>('toAST', {

  // ---------------------------------------------------------------------------
  // Syntactic rules — no explicit space params (auto-skipped by Ohm)
  // ---------------------------------------------------------------------------

  Expression_withCommand(command, expr) {
    const name = command.sourceString.toLowerCase() as 'calc' | 'list' | 'count' | 'set'
    return { kind: 'Command', name, expr: expr.toAST() }
  },
  Expression(e) { return e.toAST() },

  Expr_add(left, _op, right) {
    return { kind: 'BinOp', op: '+', left: left.toAST(), right: right.toAST() }
  },
  Expr_sub(left, _op, right) {
    return { kind: 'BinOp', op: '-', left: left.toAST(), right: right.toAST() }
  },
  Expr(e) { return e.toAST() },

  Term_mul(left, _op, right) {
    return { kind: 'BinOp', op: '*', left: left.toAST(), right: right.toAST() }
  },
  Term_div(left, _op, right) {
    return { kind: 'BinOp', op: '/', left: left.toAST(), right: right.toAST() }
  },
  Term(e) { return e.toAST() },

  Factor_exp(base, _op, exponent) {
    return { kind: 'Exp', base: base.toAST(), exponent: exponent.toAST() }
  },
  Factor(e) { return e.toAST() },

  Primary_paren(_open, expr, _close) {
    return expr.toAST()
  },
  Primary(e) { return e.toAST() },

  // ---------------------------------------------------------------------------
  // Lexical rules — spaces are explicit params
  // ---------------------------------------------------------------------------

  // keyword — named alternatives (multi-element)
  keyword_nextUnit(_kw, _sp, unit) {
    return { kind: 'RelativeDate', direction: 'next' as RelativeDirection, unit: normalizeCalendarUnit(unit.sourceString) }
  },
  keyword_lastUnit(_kw, _sp, unit) {
    return { kind: 'RelativeDate', direction: 'last' as RelativeDirection, unit: normalizeCalendarUnit(unit.sourceString) }
  },
  keyword_thisUnit(_kw, _sp, unit) {
    return { kind: 'RelativeDate', direction: 'this' as RelativeDirection, unit: normalizeCalendarUnit(unit.sourceString) }
  },
  keyword_nextWeekday(_kw, _sp, wd) {
    return { kind: 'RelativeWeekday', direction: 'next' as 'next' | 'last', weekday: normalizeWeekday(wd.sourceString) }
  },
  keyword_lastWeekday(_kw, _sp, wd) {
    return { kind: 'RelativeWeekday', direction: 'last' as 'next' | 'last', weekday: normalizeWeekday(wd.sourceString) }
  },
  keyword_yesterday(_k) { return { kind: 'Keyword', word: 'yesterday' as const } },
  keyword_tomorrow(_k)  { return { kind: 'Keyword', word: 'tomorrow'  as const } },
  keyword_today(_k)     { return { kind: 'Keyword', word: 'today'     as const } },
  keyword_now(_k)       { return { kind: 'Keyword', word: 'now'       as const } },

  // Duration
  duration_withSpace(num, _sp, unit) {
    return {
      kind: 'Duration',
      magnitude: (num.toAST() as { kind: 'Number'; value: number }).value,
      unit: normalizeUnit(unit.sourceString),
    }
  },
  duration_noSpace(num, unit) {
    return {
      kind: 'Duration',
      magnitude: (num.toAST() as { kind: 'Number'; value: number }).value,
      unit: normalizeUnit(unit.sourceString),
    }
  },

  // Datetime
  datetime_isoDatetimeTz(date, _T, time, tz) {
    return {
      kind: 'RawDatetime',
      date: extractDate(date.toAST()),
      time: extractTime(time.toAST()),
      tz: parseTzOffset(tz.sourceString),
    }
  },
  datetime_isoDatetime(date, _T, time) {
    return {
      kind: 'RawDatetime',
      date: extractDate(date.toAST()),
      time: extractTime(time.toAST()),
    }
  },
  datetime_dateAndTimeTz(date, _sp, time, tz) {
    return {
      kind: 'RawDatetime',
      date: extractDate(date.toAST()),
      time: extractTime(time.toAST()),
      tz: parseTzOffset(tz.sourceString),
    }
  },
  datetime_dateAndTime(date, _sp, time) {
    return {
      kind: 'RawDatetime',
      date: extractDate(date.toAST()),
      time: extractTime(time.toAST()),
    }
  },
  datetime_dateOnly(date) { return date.toAST() },
  datetime_timeOnly(time) { return time.toAST() },

  // Date formats — use sourceString on helper rules for clean integer parsing
  date_ymd(year, _sep1, month, _sep2, day) {
    return { kind: 'RawDate', date: { year: int(year), month: int(month), day: int(day) } }
  },
  date_mdY(month, _sep1, day, _sep2, year) {
    return { kind: 'RawDate', date: { year: int(year), month: int(month), day: int(day) } }
  },
  date_mdy(month, _sep1, day, _sep2, year) {
    return { kind: 'RawDate', date: { year: twoDigitYear(int(year)), month: int(month), day: int(day) } }
  },
  date_dmY(day, _sp1, month, _sp2, year) {
    return { kind: 'RawDate', date: { year: int(year), month: monthNameToNum(month.sourceString), day: int(day) } }
  },
  date_mDY(month, _sp1, day, _comma, _sp2, year) {
    return { kind: 'RawDate', date: { year: int(year), month: monthNameToNum(month.sourceString), day: int(day) } }
  },

  // Time formats — 12-hour (with meridiem) before 24-hour
  time_hmsf12(h, _c1, m, _c2, s, _dot, ms, _optSp, mer) {
    return { kind: 'RawTime', time: { h: to24h(int(h), mer.sourceString), m: int(m), s: int(s), ms: int(ms) } }
  },
  time_hms12(h, _c1, m, _c2, s, _optSp, mer) {
    return { kind: 'RawTime', time: { h: to24h(int(h), mer.sourceString), m: int(m), s: int(s), ms: 0 } }
  },
  time_hm12(h, _c1, m, _optSp, mer) {
    return { kind: 'RawTime', time: { h: to24h(int(h), mer.sourceString), m: int(m), s: 0, ms: 0 } }
  },

  // Time formats — 24-hour
  time_hmsf(h, _c1, m, _c2, s, _dot, ms) {
    return { kind: 'RawTime', time: { h: int(h), m: int(m), s: int(s), ms: int(ms) } }
  },
  time_hms(h, _c1, m, _c2, s) {
    return { kind: 'RawTime', time: { h: int(h), m: int(m), s: int(s), ms: 0 } }
  },
  time_hm(h, _c1, m) {
    return { kind: 'RawTime', time: { h: int(h), m: int(m), s: 0, ms: 0 } }
  },

  // Numbers
  number_decimal(intPart, _dot, fracPart) {
    return { kind: 'Number', value: parseFloat(`${intPart.sourceString}.${fracPart.sourceString}`) }
  },
  number_integer(digits) {
    return { kind: 'Number', value: parseInt(digits.sourceString, 10) }
  },

  // Default: delegate to child (handles inline rules, timeUnit, monthName, dateSep, etc.)
  _nonterminal(...children) {
    if (children.length === 1) return children[0].toAST()
    // Shouldn't reach here for named rules, but guard just in case
    throw new Error(`Unexpected _nonterminal with ${children.length} children in rule: ${this.ctorName}`)
  },
  _iter(...children) {
    // Return the concatenated source for iteration nodes used in helper rules
    return { kind: 'Number', value: 0 } as Node  // placeholder; overridden by sourceString usage
  },
  _terminal() {
    return { kind: 'Number', value: 0 } as Node  // placeholder; never called for our named rules
  },
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function int(node: ohm.NonterminalNode | ohm.IterationNode): number {
  return parseInt(node.sourceString, 10)
}

function twoDigitYear(y: number): number {
  return y >= 0 && y <= 99 ? (y >= 70 ? 1900 + y : 2000 + y) : y
}

function monthNameToNum(name: string): number {
  const months: Record<string, number> = {
    january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3,
    april: 4, apr: 4, may: 5, june: 6, jun: 6, july: 7, jul: 7,
    august: 8, aug: 8, september: 9, sep: 9, october: 10, oct: 10,
    november: 11, nov: 11, december: 12, dec: 12,
  }
  return months[name.toLowerCase()] ?? 1
}

function normalizeUnit(raw: string): DurationUnit {
  const u = raw.toLowerCase()
  if (['ms', 'msec', 'msecs', 'millisec', 'millisecs', 'milli', 'millis', 'millisecond', 'milliseconds'].includes(u)) return 'milliseconds'
  if (['s', 'sec', 'secs', 'second', 'seconds'].includes(u)) return 'seconds'
  if (['m', 'min', 'mins', 'minute', 'minutes'].includes(u)) return 'minutes'
  if (['h', 'hr', 'hrs', 'hour', 'hours'].includes(u)) return 'hours'
  if (['d', 'dy', 'dys', 'day', 'days'].includes(u)) return 'days'
  if (['w', 'wk', 'wks', 'week', 'weeks'].includes(u)) return 'weeks'
  if (['mon', 'mons', 'month', 'months'].includes(u)) return 'months'
  if (['y', 'yr', 'yrs', 'year', 'years'].includes(u)) return 'years'
  return 'days'
}

function normalizeCalendarUnit(raw: string): CalendarUnit {
  const u = raw.toLowerCase()
  if (u === 'year') return 'year'
  if (u === 'month') return 'month'
  if (u === 'week') return 'week'
  return 'day'
}

function normalizeWeekday(raw: string): Weekday {
  const w = raw.toLowerCase()
  if (['monday', 'mon'].includes(w)) return 'monday'
  if (['tuesday', 'tue', 'tues'].includes(w)) return 'tuesday'
  if (['wednesday', 'wed'].includes(w)) return 'wednesday'
  if (['thursday', 'thu', 'thur', 'thurs'].includes(w)) return 'thursday'
  if (['friday', 'fri'].includes(w)) return 'friday'
  if (['saturday', 'sat'].includes(w)) return 'saturday'
  return 'sunday'
}

/** Convert a 12-hour clock hour + meridiem string to a 24-hour hour. */
function to24h(h: number, meridiem: string): number {
  const pm = meridiem.toLowerCase() === 'pm'
  if (pm && h !== 12) return h + 12
  if (!pm && h === 12) return 0
  return h
}

/** Parse a tzOffset sourceString (e.g. "Z", "+05:30", "-05:00") to offset minutes. */
function parseTzOffset(s: string): number {
  if (s.toLowerCase() === 'z') return 0
  const sign = s[0] === '+' ? 1 : -1
  const parts = s.slice(1).split(':')
  return sign * (parseInt(parts[0], 10) * 60 + parseInt(parts[1] ?? '0', 10))
}

type DateNode   = { kind: 'RawDate';  date:  import('./ast.js').RawDate }
type TimeNode   = { kind: 'RawTime';  time:  import('./ast.js').RawTime }

function extractDate(node: Node): import('./ast.js').RawDate {
  return (node as DateNode).date
}
function extractTime(node: Node): import('./ast.js').RawTime {
  return (node as TimeNode).time
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

export class ParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ParseError'
  }
}

export function parse(input: string): Node {
  const trimmed = input.trim()
  const result = grammar.match(trimmed)
  if (result.failed()) {
    throw new ParseError(result.message ?? `Failed to parse: ${trimmed}`)
  }
  return semantics(result).toAST()
}
