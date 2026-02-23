import { describe, it, expect } from 'vitest'
import { parse } from '../src/grammar/parser.js'

describe('parser — numbers', () => {
  it('parses an integer', () => {
    expect(parse('42')).toEqual({ kind: 'Number', value: 42 })
  })
  it('parses a decimal', () => {
    expect(parse('3.14')).toEqual({ kind: 'Number', value: 3.14 })
  })
})

describe('parser — arithmetic', () => {
  it('parses addition', () => {
    expect(parse('2 + 2')).toEqual({
      kind: 'BinOp', op: '+',
      left:  { kind: 'Number', value: 2 },
      right: { kind: 'Number', value: 2 },
    })
  })
  it('parses subtraction', () => {
    expect(parse('10 - 3')).toEqual({
      kind: 'BinOp', op: '-',
      left:  { kind: 'Number', value: 10 },
      right: { kind: 'Number', value: 3 },
    })
  })
  it('parses multiplication', () => {
    expect(parse('6 * 7')).toEqual({
      kind: 'BinOp', op: '*',
      left:  { kind: 'Number', value: 6 },
      right: { kind: 'Number', value: 7 },
    })
  })
  it('parses division', () => {
    expect(parse('10 / 2')).toEqual({
      kind: 'BinOp', op: '/',
      left:  { kind: 'Number', value: 10 },
      right: { kind: 'Number', value: 2 },
    })
  })
  it('respects precedence: 2 + 3 * 4', () => {
    const ast = parse('2 + 3 * 4')
    expect(ast).toMatchObject({
      kind: 'BinOp', op: '+',
      left: { kind: 'Number', value: 2 },
      right: { kind: 'BinOp', op: '*',
        left:  { kind: 'Number', value: 3 },
        right: { kind: 'Number', value: 4 },
      },
    })
  })
  it('parses parentheses', () => {
    const ast = parse('(2 + 3) * 4')
    expect(ast).toMatchObject({
      kind: 'BinOp', op: '*',
      left: { kind: 'BinOp', op: '+' },
      right: { kind: 'Number', value: 4 },
    })
  })
  it('parses exponentiation', () => {
    expect(parse('2^8')).toEqual({
      kind: 'Exp',
      base:     { kind: 'Number', value: 2 },
      exponent: { kind: 'Number', value: 8 },
    })
  })
})

describe('parser — durations', () => {
  it('parses 5d (no space)', () => {
    expect(parse('5d')).toEqual({ kind: 'Duration', magnitude: 5, unit: 'days' })
  })
  it('parses 30 minutes (with space)', () => {
    expect(parse('30 minutes')).toEqual({ kind: 'Duration', magnitude: 30, unit: 'minutes' })
  })
  it('parses 2.5 hours', () => {
    expect(parse('2.5 hours')).toEqual({ kind: 'Duration', magnitude: 2.5, unit: 'hours' })
  })
  it('parses 1w', () => {
    expect(parse('1w')).toEqual({ kind: 'Duration', magnitude: 1, unit: 'weeks' })
  })
  it('parses 500ms', () => {
    expect(parse('500ms')).toEqual({ kind: 'Duration', magnitude: 500, unit: 'milliseconds' })
  })
})

describe('parser — dates', () => {
  it('parses YYYY-MM-DD', () => {
    expect(parse('2026-01-15')).toEqual({ kind: 'RawDate', date: { year: 2026, month: 1, day: 15 } })
  })
  it('parses YYYY/MM/DD', () => {
    expect(parse('2026/01/15')).toEqual({ kind: 'RawDate', date: { year: 2026, month: 1, day: 15 } })
  })
  it('parses MM-DD-YYYY', () => {
    expect(parse('01-15-2026')).toEqual({ kind: 'RawDate', date: { year: 2026, month: 1, day: 15 } })
  })
  it('parses DD MonthName YYYY', () => {
    expect(parse('15 January 2026')).toEqual({ kind: 'RawDate', date: { year: 2026, month: 1, day: 15 } })
  })
  it('parses MonthName DD, YYYY', () => {
    expect(parse('January 15, 2026')).toEqual({ kind: 'RawDate', date: { year: 2026, month: 1, day: 15 } })
  })
  it('parses abbreviated month names', () => {
    expect(parse('15 Jan 2026')).toEqual({ kind: 'RawDate', date: { year: 2026, month: 1, day: 15 } })
  })
})

describe('parser — times', () => {
  it('parses HH:MM', () => {
    expect(parse('14:30')).toEqual({ kind: 'RawTime', time: { h: 14, m: 30, s: 0, ms: 0 } })
  })
  it('parses HH:MM:SS', () => {
    expect(parse('14:30:45')).toEqual({ kind: 'RawTime', time: { h: 14, m: 30, s: 45, ms: 0 } })
  })
  it('parses HH:MM:SS.mmm', () => {
    expect(parse('14:30:45.123')).toEqual({ kind: 'RawTime', time: { h: 14, m: 30, s: 45, ms: 123 } })
  })
})

describe('parser — datetime combos', () => {
  it('parses ISO datetime with T', () => {
    expect(parse('2026-01-15T14:30:00')).toMatchObject({
      kind: 'RawDatetime',
      date: { year: 2026, month: 1, day: 15 },
      time: { h: 14, m: 30, s: 0 },
    })
  })
  it('parses date with space and time', () => {
    expect(parse('2026-01-15 14:30:00')).toMatchObject({
      kind: 'RawDatetime',
      date: { year: 2026, month: 1, day: 15 },
      time: { h: 14, m: 30, s: 0 },
    })
  })
})

describe('parser — times (12-hour)', () => {
  it('parses H:MMpm (no space)', () => {
    expect(parse('3:30pm')).toEqual({ kind: 'RawTime', time: { h: 15, m: 30, s: 0, ms: 0 } })
  })
  it('parses H:MM AM (with space)', () => {
    expect(parse('10:00 AM')).toEqual({ kind: 'RawTime', time: { h: 10, m: 0, s: 0, ms: 0 } })
  })
  it('converts 12:00am to midnight (hour 0)', () => {
    expect(parse('12:00am')).toMatchObject({ kind: 'RawTime', time: { h: 0, m: 0 } })
  })
  it('converts 12:30pm to noon + 30m (hour 12)', () => {
    expect(parse('12:30pm')).toMatchObject({ kind: 'RawTime', time: { h: 12, m: 30 } })
  })
  it('converts 1:00pm to hour 13', () => {
    expect(parse('1:00pm')).toMatchObject({ kind: 'RawTime', time: { h: 13, m: 0 } })
  })
  it('converts 11:59PM to hour 23', () => {
    expect(parse('11:59PM')).toMatchObject({ kind: 'RawTime', time: { h: 23, m: 59 } })
  })
  it('parses H:MM:SSpm (with seconds)', () => {
    expect(parse('2:30:45pm')).toMatchObject({ kind: 'RawTime', time: { h: 14, m: 30, s: 45 } })
  })
  it('parses date with 12h time', () => {
    expect(parse('2026-01-15 3:30pm')).toMatchObject({
      kind: 'RawDatetime',
      date: { year: 2026, month: 1, day: 15 },
      time: { h: 15, m: 30 },
    })
  })
})

describe('parser — keywords', () => {
  it('parses now', () => {
    expect(parse('now')).toEqual({ kind: 'Keyword', word: 'now' })
  })
  it('parses today (case-insensitive)', () => {
    expect(parse('Today')).toEqual({ kind: 'Keyword', word: 'today' })
  })
  it('parses tomorrow', () => {
    expect(parse('tomorrow')).toEqual({ kind: 'Keyword', word: 'tomorrow' })
  })
  it('parses yesterday', () => {
    expect(parse('yesterday')).toEqual({ kind: 'Keyword', word: 'yesterday' })
  })
})

describe('parser — relative dates', () => {
  it('parses next week', () => {
    expect(parse('next week')).toEqual({ kind: 'RelativeDate', direction: 'next', unit: 'week' })
  })
  it('parses last month', () => {
    expect(parse('last month')).toEqual({ kind: 'RelativeDate', direction: 'last', unit: 'month' })
  })
  it('parses this year', () => {
    expect(parse('this year')).toEqual({ kind: 'RelativeDate', direction: 'this', unit: 'year' })
  })
  it('parses next day', () => {
    expect(parse('next day')).toEqual({ kind: 'RelativeDate', direction: 'next', unit: 'day' })
  })
  it('parses last week (case-insensitive)', () => {
    expect(parse('Last Week')).toEqual({ kind: 'RelativeDate', direction: 'last', unit: 'week' })
  })
  it('parses this month', () => {
    expect(parse('this month')).toEqual({ kind: 'RelativeDate', direction: 'this', unit: 'month' })
  })
})

describe('parser — relative weekdays', () => {
  it('parses next monday', () => {
    expect(parse('next monday')).toEqual({ kind: 'RelativeWeekday', direction: 'next', weekday: 'monday' })
  })
  it('parses last friday', () => {
    expect(parse('last friday')).toEqual({ kind: 'RelativeWeekday', direction: 'last', weekday: 'friday' })
  })
  it('parses next wed (abbreviation)', () => {
    expect(parse('next wed')).toEqual({ kind: 'RelativeWeekday', direction: 'next', weekday: 'wednesday' })
  })
  it('parses last sat', () => {
    expect(parse('last sat')).toEqual({ kind: 'RelativeWeekday', direction: 'last', weekday: 'saturday' })
  })
  it('parses next sun', () => {
    expect(parse('next sun')).toEqual({ kind: 'RelativeWeekday', direction: 'next', weekday: 'sunday' })
  })
  it('parses next week + 2d (relative date in expression)', () => {
    expect(parse('next week + 2d')).toMatchObject({
      kind: 'BinOp', op: '+',
      left:  { kind: 'RelativeDate', direction: 'next', unit: 'week' },
      right: { kind: 'Duration', unit: 'days' },
    })
  })
})

describe('parser — commands', () => {
  it('parses calc command', () => {
    expect(parse('calc 2 + 2')).toMatchObject({ kind: 'Command', name: 'calc' })
  })
  it('parses list command', () => {
    expect(parse('list 5d')).toMatchObject({ kind: 'Command', name: 'list' })
  })
})

describe('parser — mixed expressions', () => {
  it('parses date + duration', () => {
    expect(parse('2026-01-01 + 30d')).toMatchObject({
      kind: 'BinOp', op: '+',
      left:  { kind: 'RawDate' },
      right: { kind: 'Duration', unit: 'days' },
    })
  })
  it('parses now + duration', () => {
    expect(parse('now + 5d')).toMatchObject({
      kind: 'BinOp', op: '+',
      left:  { kind: 'Keyword', word: 'now' },
      right: { kind: 'Duration', unit: 'days' },
    })
  })
  it('parses duration * number', () => {
    expect(parse('2d * 3')).toMatchObject({
      kind: 'BinOp', op: '*',
      left:  { kind: 'Duration' },
      right: { kind: 'Number' },
    })
  })
})

describe('parser — errors', () => {
  it('throws on invalid input', () => {
    expect(() => parse('???')).toThrowError()
  })
})
