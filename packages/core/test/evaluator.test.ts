import { describe, it, expect } from 'vitest'
import { calc, format } from '../src/index.js'
import { DateTime } from 'luxon'

describe('evaluator — number arithmetic', () => {
  it('adds two numbers', () => {
    const v = calc('2 + 2')
    expect(v).toEqual({ type: 'number', value: 4 })
  })
  it('subtracts', () => {
    expect(calc('10 - 3')).toEqual({ type: 'number', value: 7 })
  })
  it('multiplies', () => {
    expect(calc('6 * 7')).toEqual({ type: 'number', value: 42 })
  })
  it('divides', () => {
    expect(calc('10 / 4')).toEqual({ type: 'number', value: 2.5 })
  })
  it('respects PEMDAS', () => {
    expect(calc('2 + 3 * 4')).toEqual({ type: 'number', value: 14 })
  })
  it('parentheses override precedence', () => {
    expect(calc('(2 + 3) * 4')).toEqual({ type: 'number', value: 20 })
  })
  it('raises to a power', () => {
    expect(calc('2^10')).toEqual({ type: 'number', value: 1024 })
  })
})

describe('evaluator — duration arithmetic', () => {
  it('adds two durations', () => {
    const v = calc('1h + 30m')
    expect(v.type).toBe('duration')
    if (v.type === 'duration') {
      expect(v.value.toMillis()).toBe(90 * 60 * 1000)
    }
  })
  it('subtracts durations', () => {
    const v = calc('2h - 30m')
    expect(v.type).toBe('duration')
    if (v.type === 'duration') {
      expect(v.value.toMillis()).toBe(90 * 60 * 1000)
    }
  })
  it('multiplies duration by number', () => {
    const v = calc('2d * 3')
    expect(v.type).toBe('duration')
    if (v.type === 'duration') {
      expect(v.value.as('days')).toBe(6)
    }
  })
  it('multiplies number by duration', () => {
    const v = calc('3 * 2d')
    expect(v.type).toBe('duration')
    if (v.type === 'duration') {
      expect(v.value.as('days')).toBe(6)
    }
  })
  it('divides duration by number', () => {
    const v = calc('6d / 2')
    expect(v.type).toBe('duration')
    if (v.type === 'duration') {
      expect(v.value.as('days')).toBe(3)
    }
  })
})

describe('evaluator — date arithmetic', () => {
  it('adds a duration to a date', () => {
    const v = calc('2026-01-01 + 30d')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.toISODate()).toBe('2026-01-31')
    }
  })
  it('subtracts a duration from a date', () => {
    const v = calc('2026-02-01 - 1w')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.toISODate()).toBe('2026-01-25')
    }
  })
  it('subtracts two dates to get a duration', () => {
    const v = calc('2026-02-01 - 2026-01-01')
    expect(v.type).toBe('duration')
    if (v.type === 'duration') {
      // 31 days in milliseconds
      expect(v.value.toMillis()).toBe(31 * 24 * 60 * 60 * 1000)
    }
  })
})

describe('evaluator — keywords', () => {
  it('now returns a datetime close to the current time', () => {
    const before = DateTime.now()
    const v = calc('now')
    const after = DateTime.now()
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.toMillis()).toBeGreaterThanOrEqual(before.toMillis() - 10)
      expect(v.value.toMillis()).toBeLessThanOrEqual(after.toMillis() + 10)
    }
  })
  it('today returns start of today', () => {
    const v = calc('today')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.toISODate()).toBe(DateTime.now().toISODate())
      expect(v.value.hour).toBe(0)
    }
  })
  it('tomorrow is one day after today', () => {
    const v = calc('tomorrow')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.toISODate()).toBe(DateTime.now().plus({ days: 1 }).toISODate())
    }
  })
  it('now + 5d returns a datetime 5 days from now', () => {
    const before = DateTime.now().plus({ days: 5 })
    const v = calc('now + 5d')
    const after = DateTime.now().plus({ days: 5 })
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.toMillis()).toBeGreaterThanOrEqual(before.toMillis() - 100)
      expect(v.value.toMillis()).toBeLessThanOrEqual(after.toMillis() + 100)
    }
  })
})

describe('evaluator — type errors', () => {
  it('throws on datetime + datetime', () => {
    expect(() => calc('2026-01-01 + 2026-02-01')).toThrow()
  })
  it('throws on division by zero', () => {
    expect(() => calc('10 / 0')).toThrow()
  })
})

describe('format', () => {
  it('formats an integer number', () => {
    expect(format({ type: 'number', value: 42 })).toBe('42')
  })
  it('formats a decimal number', () => {
    expect(format({ type: 'number', value: 3.14159 })).toBe('3.14')
  })
  it('formats a duration in units', () => {
    const v = calc('1h + 30m')
    expect(format(v)).toContain('h')
  })
  it('formats a duration in decimal style', () => {
    const v = calc('2d')
    const s = format(v, { durationStyle: 'decimal' })
    expect(s).toContain('days')
  })
  it('formats a datetime as ISO', () => {
    const v = calc('2026-01-15')
    expect(format(v)).toContain('2026-01-15')
  })
})

describe('format — precision inference', () => {
  it('date + days → date only (no time component)', () => {
    expect(format(calc('2026-01-01 + 30d'))).toBe('2026-01-31')
  })
  it('now + days → date only (day precision from the duration)', () => {
    // `now` is ms-precise but `30d` is day-precise → result is day-level
    const result = format(calc('now + 30d'))
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('today → date only', () => {
    const result = format(calc('today'))
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('tomorrow → date only', () => {
    const result = format(calc('tomorrow'))
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('now → full timestamp with milliseconds', () => {
    const result = format(calc('now'))
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/)
  })
  it('now + minutes → shows date and time to the minute', () => {
    const result = format(calc('now + 30m'))
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })
  it('hours + minutes → shows both h and m', () => {
    expect(format(calc('1h + 30m'))).toBe('1h 30m')
  })
  it('days * number → days only', () => {
    expect(format(calc('2d * 3'))).toBe('6d')
  })
  it('date - date → day-level duration (no sub-day units)', () => {
    // Both sides are day-precise → result contains only y/mo/w/d abbreviations
    const result = format(calc('2026-02-01 - 2026-01-01'))
    expect(result).toMatch(/^-?(?:\d+(?:y|mo|w|d)\s*)+$/)
  })
  it('now - today → sub-day duration (fine precision from now)', () => {
    // `now` is ms-precise, `today` is day-precise → finer wins = ms
    const result = format(calc('now - today'))
    // Should include at minimum hours and minutes (elapsed since midnight)
    expect(result).toMatch(/h/)
  })
})
