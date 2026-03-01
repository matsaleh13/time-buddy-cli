import { describe, it, expect } from 'vitest'
import { calc, format, toJSON, EvalError } from '../src/index.js'
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

describe('format — durationUnit option', () => {
  it('expresses 1h 30m in minutes', () => {
    expect(format(calc('1h + 30m'), { durationUnit: 'minutes' })).toBe('90.00 minutes')
  })
  it('expresses 1h 30m in hours', () => {
    expect(format(calc('1h + 30m'), { durationUnit: 'hours' })).toBe('1.50 hours')
  })
  it('expresses 2d in hours', () => {
    expect(format(calc('2d'), { durationUnit: 'hours' })).toBe('48.00 hours')
  })
  it('respects decimalPlaces', () => {
    expect(format(calc('1h + 30m'), { durationUnit: 'hours', decimalPlaces: 1 })).toBe('1.5 hours')
  })
  it('handles negative duration', () => {
    const v = calc('30m - 1h')
    expect(format(v, { durationUnit: 'minutes' })).toBe('-30.00 minutes')
  })
})

describe('toJSON', () => {
  it('serialises a number', () => {
    const obj = toJSON(calc('42')) as any
    expect(obj.type).toBe('number')
    expect(obj.value).toBe(42)
  })
  it('serialises a duration', () => {
    const obj = toJSON(calc('1h + 30m')) as any
    expect(obj.type).toBe('duration')
    expect(obj.milliseconds).toBe(5400000)
    expect(typeof obj.value).toBe('string')
  })
  it('serialises a datetime', () => {
    const obj = toJSON(calc('2026-01-15T14:30Z')) as any
    expect(obj.type).toBe('datetime')
    expect(obj.iso).toContain('2026-01-15')
    expect(typeof obj.unix).toBe('number')
  })
  it('duration value field reflects formatOpts', () => {
    const obj = toJSON(calc('1h + 30m'), { durationUnit: 'hours' }) as any
    expect(obj.value).toBe('1.50 hours')
    expect(obj.milliseconds).toBe(5400000)
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

// ---------------------------------------------------------------------------
// Phase 3 — list and count
// ---------------------------------------------------------------------------

describe('list — weekdays filter', () => {
  // March 2026: starts on Sunday. 22 weekdays (Mon–Fri), 9 weekend days.
  it('weekdays from 2026-03-01 to 2026-03-31 returns 22 items', () => {
    const v = calc('weekdays from 2026-03-01 to 2026-03-31')
    expect(v.type).toBe('list')
    if (v.type === 'list') expect(v.items).toHaveLength(22)
  })
  it('all returned days are Mon–Fri', () => {
    const v = calc('weekdays from 2026-03-01 to 2026-03-31')
    if (v.type === 'list') {
      for (const item of v.items) {
        expect(item.value.weekday).toBeLessThanOrEqual(5)
      }
    }
  })
  it('first and last are correct', () => {
    const v = calc('weekdays from 2026-03-01 to 2026-03-31')
    if (v.type === 'list') {
      expect(v.items[0].value.toISODate()).toBe('2026-03-02')   // first Mon
      expect(v.items.at(-1)!.value.toISODate()).toBe('2026-03-31') // last Tue
    }
  })
  it('format joins with newlines', () => {
    const v = calc('weekdays from 2026-03-02 to 2026-03-04')
    const s = format(v)
    expect(s).toBe('2026-03-02\n2026-03-03\n2026-03-04')
  })
})

describe('list — weekends filter', () => {
  it('weekends from 2026-03-01 to 2026-03-31 returns 9 items', () => {
    const v = calc('weekends from 2026-03-01 to 2026-03-31')
    expect(v.type).toBe('list')
    if (v.type === 'list') expect(v.items).toHaveLength(9)
  })
  it('all returned days are Sat–Sun', () => {
    const v = calc('weekends from 2026-03-01 to 2026-03-31')
    if (v.type === 'list') {
      for (const item of v.items) {
        expect(item.value.weekday).toBeGreaterThanOrEqual(6)
      }
    }
  })
  it('includes start date if it is a weekend', () => {
    // 2026-03-01 is Sunday
    const v = calc('weekends from 2026-03-01 to 2026-03-01')
    if (v.type === 'list') {
      expect(v.items).toHaveLength(1)
      expect(v.items[0].value.toISODate()).toBe('2026-03-01')
    }
  })
})

describe('list — every weekday', () => {
  it('every monday from 2026-03-01 to 2026-03-31 returns 5 Mondays', () => {
    // March 2026 Mondays: Mar 2, 9, 16, 23, 30
    const v = calc('every monday from 2026-03-01 to 2026-03-31')
    expect(v.type).toBe('list')
    if (v.type === 'list') {
      expect(v.items).toHaveLength(5)
      expect(v.items[0].value.toISODate()).toBe('2026-03-02')
      expect(v.items[1].value.toISODate()).toBe('2026-03-09')
      expect(v.items[2].value.toISODate()).toBe('2026-03-16')
      expect(v.items[3].value.toISODate()).toBe('2026-03-23')
      expect(v.items[4].value.toISODate()).toBe('2026-03-30')
    }
  })
  it('every monday from 2026-03-01 to 2026-03-29 returns 4 Mondays', () => {
    // Excludes Mar 30, so only Mar 2, 9, 16, 23
    const v = calc('every monday from 2026-03-01 to 2026-03-29')
    if (v.type === 'list') expect(v.items).toHaveLength(4)
  })
  it('every friday from 2026-03-06 to 2026-03-06 returns just that Friday', () => {
    const v = calc('every friday from 2026-03-06 to 2026-03-06')
    if (v.type === 'list') {
      expect(v.items).toHaveLength(1)
      expect(v.items[0].value.toISODate()).toBe('2026-03-06')
    }
  })
  it('includes start date when it matches the target weekday', () => {
    // 2026-03-02 is a Monday
    const v = calc('every monday from 2026-03-02 to 2026-03-02')
    if (v.type === 'list') {
      expect(v.items).toHaveLength(1)
      expect(v.items[0].value.toISODate()).toBe('2026-03-02')
    }
  })
})

describe('list — every duration', () => {
  it('every 1w from 2026-03-01 to 2026-03-31 returns 5 dates', () => {
    // 2026-03-01, 08, 15, 22, 29
    const v = calc('every 1w from 2026-03-01 to 2026-03-31')
    expect(v.type).toBe('list')
    if (v.type === 'list') {
      expect(v.items).toHaveLength(5)
      expect(v.items[0].value.toISODate()).toBe('2026-03-01')
      expect(v.items[4].value.toISODate()).toBe('2026-03-29')
    }
  })
  it('every 2 weeks from 2026-03-01 to 2026-03-31 returns 3 dates', () => {
    // 2026-03-01, 2026-03-15, 2026-03-29
    const v = calc('every 2 weeks from 2026-03-01 to 2026-03-31')
    if (v.type === 'list') {
      expect(v.items).toHaveLength(3)
      expect(v.items[0].value.toISODate()).toBe('2026-03-01')
      expect(v.items[1].value.toISODate()).toBe('2026-03-15')
      expect(v.items[2].value.toISODate()).toBe('2026-03-29')
    }
  })
  it('every 10d from 2026-01-01 to 2026-01-31 returns 4 dates', () => {
    // Jan 1, 11, 21, 31
    const v = calc('every 10d from 2026-01-01 to 2026-01-31')
    if (v.type === 'list') {
      expect(v.items).toHaveLength(4)
      expect(v.items[3].value.toISODate()).toBe('2026-01-31')
    }
  })
  it('returns empty list when from > to', () => {
    const v = calc('every 1w from 2026-03-31 to 2026-03-01')
    if (v.type === 'list') expect(v.items).toHaveLength(0)
  })
  it('empty list formats as "(no results)"', () => {
    const v = calc('every 1w from 2026-03-31 to 2026-03-01')
    expect(format(v)).toBe('(no results)')
  })
})

describe('count command', () => {
  it('count weekdays from 2026-03-01 to 2026-03-31 = 22', () => {
    expect(calc('count weekdays from 2026-03-01 to 2026-03-31')).toEqual({ type: 'number', value: 22 })
  })
  it('count weekends from 2026-03-01 to 2026-03-31 = 9', () => {
    expect(calc('count weekends from 2026-03-01 to 2026-03-31')).toEqual({ type: 'number', value: 9 })
  })
  it('count every monday from 2026-03-01 to 2026-03-31 = 5', () => {
    expect(calc('count every monday from 2026-03-01 to 2026-03-31')).toEqual({ type: 'number', value: 5 })
  })
  it('count every 1w from 2026-03-01 to 2026-03-31 = 5', () => {
    expect(calc('count every 1w from 2026-03-01 to 2026-03-31')).toEqual({ type: 'number', value: 5 })
  })
  it('count with list prefix command works too', () => {
    // "list weekdays from X to Y" returns a list value; the formatter should handle it
    const v = calc('list weekdays from 2026-03-01 to 2026-03-31')
    expect(v.type).toBe('list')
    if (v.type === 'list') expect(v.items).toHaveLength(22)
  })
})

describe('list — toJSON', () => {
  it('serialises list with count and items array', () => {
    const obj = toJSON(calc('weekdays from 2026-03-02 to 2026-03-04')) as any
    expect(obj.type).toBe('list')
    expect(obj.count).toBe(3)
    expect(Array.isArray(obj.items)).toBe(true)
    expect(obj.items[0]).toBe('2026-03-02')
  })
})

describe('parser — ListExpr', () => {
  it('parses weekdays from X to Y', () => {
    const v = calc('weekdays from 2026-03-01 to 2026-03-07')
    expect(v.type).toBe('list')
  })
  it('parses weekends from X to Y', () => {
    const v = calc('weekends from 2026-03-01 to 2026-03-07')
    expect(v.type).toBe('list')
  })
  it('parses every monday from X to Y', () => {
    const v = calc('every monday from 2026-03-01 to 2026-03-31')
    expect(v.type).toBe('list')
  })
  it('parses every 2w from X to Y', () => {
    const v = calc('every 2w from 2026-03-01 to 2026-03-31')
    expect(v.type).toBe('list')
  })
  it('parses every 2 weeks from X to Y (with space in duration)', () => {
    const v = calc('every 2 weeks from 2026-03-01 to 2026-03-31')
    expect(v.type).toBe('list')
  })
  it('parses case-insensitively', () => {
    const v = calc('WEEKDAYS from 2026-03-01 to 2026-03-07')
    expect(v.type).toBe('list')
  })
  it('parses with command prefix: list weekdays from X to Y', () => {
    const v = calc('list weekdays from 2026-03-01 to 2026-03-31')
    expect(v.type).toBe('list')
  })
  it('parses with command prefix: count weekdays from X to Y', () => {
    const v = calc('count weekdays from 2026-03-01 to 2026-03-31')
    expect(v.type).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// Coverage gap fill-ins
// ---------------------------------------------------------------------------

describe('format — zero duration (units style)', () => {
  it('today - today formats as "0d"', () => {
    expect(format(calc('today - today'))).toBe('0d')
  })
  it('1ms - 1ms formats as "0ms"', () => {
    expect(format(calc('1ms - 1ms'))).toBe('0ms')
  })
})

describe('format — zero duration (decimal style)', () => {
  it('0ms duration with decimal style returns "0 milliseconds"', () => {
    expect(format(calc('1ms - 1ms'), { durationStyle: 'decimal' })).toBe('0 milliseconds')
  })
})

describe('evaluator — RelativeDate "this" direction', () => {
  it('this day returns today', () => {
    const v = calc('this day')
    expect(v.type).toBe('datetime')
    if (v.type === 'datetime') expect(v.value.toISODate()).toBe(calc('today').type === 'datetime' ? (calc('today') as any).value.toISODate() : null)
  })
  it('this week returns start of current week', () => {
    expect(calc('this week').type).toBe('datetime')
  })
  it('this month returns start of current month', () => {
    expect(calc('this month').type).toBe('datetime')
  })
  it('this year returns start of current year', () => {
    expect(calc('this year').type).toBe('datetime')
  })
})

describe('evaluator — ListExpr error paths', () => {
  it('throws EvalError when list "from" is not a datetime', () => {
    expect(() => calc('weekdays from 5 to 2026-03-31')).toThrow(EvalError)
  })
  it('throws EvalError when list "to" is not a datetime', () => {
    expect(() => calc('weekdays from 2026-03-01 to 5')).toThrow(EvalError)
  })
})

describe('operations — applyExp type error', () => {
  it('throws EvalError when base is not a number', () => {
    expect(() => calc('2h ^ 2')).toThrow(EvalError)
  })
})

describe('parser — 2-digit year dates', () => {
  it('interprets year 26 as 2026', () => {
    const v = calc('3/15/26')
    if (v.type === 'datetime') expect(v.value.year).toBe(2026)
  })
  it('interprets year 70 as 1970', () => {
    const v = calc('1/1/70')
    if (v.type === 'datetime') expect(v.value.year).toBe(1970)
  })
})

describe('parser — duration unit abbreviations', () => {
  it('parses "1yr" as 1 year', () => {
    const v = calc('1yr')
    if (v.type === 'duration') expect(v.value.years).toBe(1)
  })
  it('parses "1y" as 1 year', () => {
    const v = calc('1y')
    if (v.type === 'duration') expect(v.value.years).toBe(1)
  })
  it('parses "1 month" as 1 month', () => {
    const v = calc('1 month')
    if (v.type === 'duration') expect(v.value.months).toBe(1)
  })
})
