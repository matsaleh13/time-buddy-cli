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

describe('evaluator — AM/PM times', () => {
  it('3:30pm evaluates to 15:30', () => {
    const v = calc('3:30pm')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.hour).toBe(15)
      expect(v.value.minute).toBe(30)
    }
  })
  it('12:00am evaluates to midnight (hour 0)', () => {
    const v = calc('12:00am')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.hour).toBe(0)
      expect(v.value.minute).toBe(0)
    }
  })
  it('12:00pm evaluates to noon (hour 12)', () => {
    const v = calc('12:00pm')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.hour).toBe(12)
    }
  })
  it('11:59 PM evaluates to hour 23', () => {
    const v = calc('11:59 PM')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.hour).toBe(23)
      expect(v.value.minute).toBe(59)
    }
  })
  it('12h time has minute precision', () => {
    const v = calc('3:30pm')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.precision).toBe('minute')
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

describe('evaluator — yesterday / relative dates', () => {
  it('yesterday is one day before today', () => {
    const yesterday = calc('yesterday')
    const today = calc('today')
    expect(yesterday.type).toBe('datetime')
    if (yesterday.type === 'datetime' && today.type === 'datetime') {
      expect(yesterday.value.plus({ days: 1 }).toISODate()).toBe(today.value.toISODate())
      expect(yesterday.precision).toBe('day')
    }
  })
  it('next week is a Monday in the future', () => {
    const v = calc('next week')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.weekday).toBe(1)  // ISO Monday = 1
      expect(v.value.toMillis()).toBeGreaterThan(DateTime.now().startOf('day').toMillis())
      expect(v.precision).toBe('day')
    }
  })
  it('last week is a Monday in the past', () => {
    const v = calc('last week')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.weekday).toBe(1)
      expect(v.value.toMillis()).toBeLessThan(DateTime.now().startOf('day').toMillis())
    }
  })
  it('this month is the first day of the current month', () => {
    const v = calc('this month')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.day).toBe(1)
      expect(v.value.month).toBe(DateTime.now().month)
    }
  })
  it('next month is the first day of next month', () => {
    const v = calc('next month')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      const expected = DateTime.now().startOf('month').plus({ months: 1 })
      expect(v.value.toISODate()).toBe(expected.toISODate())
    }
  })
  it('this year is Jan 1 of the current year', () => {
    const v = calc('this year')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.month).toBe(1)
      expect(v.value.day).toBe(1)
      expect(v.value.year).toBe(DateTime.now().year)
    }
  })
  it('next week + 2d is a Wednesday in the future', () => {
    const v = calc('next week + 2d')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.weekday).toBe(3)  // Wednesday
    }
  })
})

describe('evaluator — relative weekdays', () => {
  it('next monday is a Monday after today', () => {
    const v = calc('next monday')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.weekday).toBe(1)
      expect(v.value.toMillis()).toBeGreaterThan(DateTime.now().startOf('day').toMillis())
      expect(v.precision).toBe('day')
    }
  })
  it('last friday is a Friday before today', () => {
    const v = calc('last friday')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.weekday).toBe(5)
      expect(v.value.toMillis()).toBeLessThan(DateTime.now().startOf('day').toMillis())
    }
  })
  it('next sunday is a Sunday in the future', () => {
    const v = calc('next sunday')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.weekday).toBe(7)
      expect(v.value.toMillis()).toBeGreaterThan(DateTime.now().startOf('day').toMillis())
    }
  })
  it('next weekday is never more than 7 days away', () => {
    const v = calc('next wednesday')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      const diff = v.value.diff(DateTime.now().startOf('day'), 'days').days
      expect(diff).toBeGreaterThan(0)
      expect(diff).toBeLessThanOrEqual(7)
    }
  })
  it('last weekday is never more than 7 days ago', () => {
    const v = calc('last thursday')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      const diff = DateTime.now().startOf('day').diff(v.value, 'days').days
      expect(diff).toBeGreaterThan(0)
      expect(diff).toBeLessThanOrEqual(7)
    }
  })
})

describe('evaluator — timezones', () => {
  it('Z suffix stores UTC zone (offset 0)', () => {
    const v = calc('2026-01-15T14:30:00Z')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.offset).toBe(0)
      expect(v.value.zone.type).toBe('fixed')
    }
  })
  it('+05:30 offset is stored correctly', () => {
    const v = calc('2026-01-15T14:30:00+05:30')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.offset).toBe(330)
    }
  })
  it('-05:00 offset is stored correctly', () => {
    const v = calc('2026-01-15T09:30:00-05:00')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.offset).toBe(-300)
    }
  })
  it('14:30+05:30 and 09:00Z are the same absolute time', () => {
    const a = calc('2026-01-15T14:30:00+05:30')
    const b = calc('2026-01-15T09:00:00Z')
    if (a.type === 'datetime' && b.type === 'datetime') {
      expect(a.value.toMillis()).toBe(b.value.toMillis())
    }
  })
  it('arithmetic preserves the timezone zone', () => {
    const v = calc('2026-01-15T14:30+05:30 + 5d')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') {
      expect(v.value.offset).toBe(330)
      expect(v.value.toISODate()).toBe('2026-01-20')
    }
  })
  it('diff of tz-aware datetimes is correct', () => {
    const v = calc('2026-01-15T14:30Z - 2026-01-15T14:00Z')
    expect(v.type).toBe('duration')
    if (v.type === 'duration') {
      expect(v.value.as('minutes')).toBe(30)
    }
  })
  it('format shows Z for UTC', () => {
    expect(format(calc('2026-01-15T14:30:00Z'))).toBe('2026-01-15 14:30Z')
  })
  it('format shows +HH:MM for positive offset', () => {
    expect(format(calc('2026-01-15T14:30:00+05:30'))).toBe('2026-01-15 14:30+05:30')
  })
  it('format shows -HH:MM for negative offset', () => {
    expect(format(calc('2026-01-15T09:30:00-05:00'))).toBe('2026-01-15 09:30-05:00')
  })
  it('format shows no suffix for local (no explicit tz) datetime', () => {
    const result = format(calc('2026-01-15T14:30:00'))
    // Should not end with a timezone suffix like "Z", "+05:30", "-05:00"
    expect(result).not.toMatch(/(Z|[+-]\d\d:\d\d)$/)
  })
  it('format preserves tz after arithmetic', () => {
    const result = format(calc('2026-01-15T14:30Z + 5d'))
    expect(result).toMatch(/Z$/)
    expect(result).toContain('2026-01-20')
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
