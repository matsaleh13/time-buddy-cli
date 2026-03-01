import { DateTime, Duration, FixedOffsetZone } from 'luxon'
import type { Node, DurationUnit, Weekday, ListInterval } from '../grammar/ast.js'
import type { Value, Precision, DatetimeValue } from './types.js'
import { EvalError } from './types.js'
import { applyBinOp, applyExp } from './operations.js'

function precisionFromUnit(unit: DurationUnit): Precision {
  switch (unit) {
    case 'milliseconds': return 'millisecond'
    case 'seconds':      return 'second'
    case 'minutes':      return 'minute'
    case 'hours':        return 'hour'
    default:             return 'day'  // days, weeks, months, years
  }
}

// Infer the finest meaningful precision from non-zero time fields.
// Times are minute-precise at minimum (HH:MM is the base format).
function precisionFromTime(s: number, ms: number): Precision {
  if (ms !== 0) return 'millisecond'
  if (s  !== 0) return 'second'
  return 'minute'
}

// Luxon ISO weekday numbers: Monday=1 … Sunday=7
function weekdayToISO(weekday: Weekday): number {
  const map: Record<Weekday, number> = {
    monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
    friday: 5, saturday: 6, sunday: 7,
  }
  return map[weekday]
}

export function evaluate(node: Node): Value {
  switch (node.kind) {
    case 'Number':
      return { type: 'number', value: node.value }

    case 'Duration':
      return {
        type: 'duration',
        value: Duration.fromObject({ [node.unit]: node.magnitude }),
        precision: precisionFromUnit(node.unit),
      }

    case 'RawDate': {
      const { year, month, day } = node.date
      const dt = DateTime.local(year, month, day, 0, 0, 0, 0)
      if (!dt.isValid) throw new EvalError(`Invalid date: ${year}-${month}-${day}`)
      return { type: 'datetime', value: dt, precision: 'day' }
    }

    case 'RawTime': {
      const { h, m, s, ms } = node.time
      const now = DateTime.now()
      const dt = DateTime.local(now.year, now.month, now.day, h, m, s, ms)
      if (!dt.isValid) throw new EvalError(`Invalid time: ${h}:${m}:${s}.${ms}`)
      return { type: 'datetime', value: dt, precision: precisionFromTime(s, ms) }
    }

    case 'RawDatetime': {
      const { year, month, day } = node.date
      const { h, m, s, ms } = node.time
      const opts = node.tz !== undefined ? { zone: FixedOffsetZone.instance(node.tz) } : {}
      const dt = DateTime.fromObject({ year, month, day, hour: h, minute: m, second: s, millisecond: ms }, opts)
      if (!dt.isValid) throw new EvalError(`Invalid datetime`)
      return { type: 'datetime', value: dt, precision: precisionFromTime(s, ms) }
    }

    case 'Keyword': {
      const now = DateTime.now()
      switch (node.word) {
        case 'now':       return { type: 'datetime', value: now,                                  precision: 'millisecond' }
        case 'today':     return { type: 'datetime', value: now.startOf('day'),                   precision: 'day' }
        case 'tomorrow':  return { type: 'datetime', value: now.startOf('day').plus({ days: 1 }), precision: 'day' }
        case 'yesterday': return { type: 'datetime', value: now.startOf('day').minus({ days: 1 }), precision: 'day' }
      }
    }

    case 'RelativeDate': {
      const now = DateTime.now()
      const { direction, unit } = node
      switch (unit) {
        case 'day':
          switch (direction) {
            case 'next': return { type: 'datetime', value: now.startOf('day').plus({ days: 1 }),   precision: 'day' }
            case 'last': return { type: 'datetime', value: now.startOf('day').minus({ days: 1 }),  precision: 'day' }
            case 'this': return { type: 'datetime', value: now.startOf('day'),                     precision: 'day' }
          }
          break
        case 'week':
          switch (direction) {
            case 'next': return { type: 'datetime', value: now.startOf('week').plus({ weeks: 1 }), precision: 'day' }
            case 'last': return { type: 'datetime', value: now.startOf('week').minus({ weeks: 1 }), precision: 'day' }
            case 'this': return { type: 'datetime', value: now.startOf('week'),                    precision: 'day' }
          }
          break
        case 'month':
          switch (direction) {
            case 'next': return { type: 'datetime', value: now.startOf('month').plus({ months: 1 }), precision: 'day' }
            case 'last': return { type: 'datetime', value: now.startOf('month').minus({ months: 1 }), precision: 'day' }
            case 'this': return { type: 'datetime', value: now.startOf('month'),                      precision: 'day' }
          }
          break
        case 'year':
          switch (direction) {
            case 'next': return { type: 'datetime', value: now.startOf('year').plus({ years: 1 }), precision: 'day' }
            case 'last': return { type: 'datetime', value: now.startOf('year').minus({ years: 1 }), precision: 'day' }
            case 'this': return { type: 'datetime', value: now.startOf('year'),                     precision: 'day' }
          }
          break
      }
      throw new EvalError(`Unknown relative date: ${direction} ${unit}`)
    }

    case 'RelativeWeekday': {
      const now = DateTime.now()
      const { direction, weekday } = node
      const targetDow = weekdayToISO(weekday)
      const currentDow = now.weekday  // Luxon: 1=Mon … 7=Sun
      if (direction === 'next') {
        const diff = ((targetDow - currentDow + 7) % 7) || 7
        return { type: 'datetime', value: now.startOf('day').plus({ days: diff }), precision: 'day' }
      } else {
        const diff = ((currentDow - targetDow + 7) % 7) || 7
        return { type: 'datetime', value: now.startOf('day').minus({ days: diff }), precision: 'day' }
      }
    }

    case 'BinOp': {
      const left  = evaluate(node.left)
      const right = evaluate(node.right)
      return applyBinOp(node.op, left, right)
    }

    case 'Exp': {
      const base = evaluate(node.base)
      const exp  = evaluate(node.exponent)
      return applyExp(base, exp)
    }

    case 'Command': {
      const result = evaluate(node.expr)
      if (node.name === 'count' && result.type === 'list') {
        return { type: 'number', value: result.items.length }
      }
      return result
    }

    case 'ListExpr': {
      const fromVal = evaluate(node.from)
      const toVal   = evaluate(node.to)
      if (fromVal.type !== 'datetime') throw new EvalError('list "from" must be a date/datetime')
      if (toVal.type   !== 'datetime') throw new EvalError('list "to" must be a date/datetime')
      return { type: 'list', items: generateList(node.interval, fromVal, toVal) }
    }
  }
}

// ---------------------------------------------------------------------------
// List generation helpers
// ---------------------------------------------------------------------------

function generateList(interval: ListInterval, from: DatetimeValue, to: DatetimeValue): DatetimeValue[] {
  const start = from.value.startOf('day')
  const end   = to.value.startOf('day')
  const items: DatetimeValue[] = []

  switch (interval.kind) {
    case 'duration': {
      const step = Duration.fromObject({ [interval.unit]: interval.magnitude })
      let cur = start
      while (cur.toMillis() <= end.toMillis()) {
        items.push({ type: 'datetime', value: cur, precision: 'day' })
        cur = cur.plus(step)
      }
      break
    }

    case 'weekday': {
      const target = weekdayToISO(interval.weekday)
      const diff = (target - start.weekday + 7) % 7
      let cur = start.plus({ days: diff })
      while (cur.toMillis() <= end.toMillis()) {
        items.push({ type: 'datetime', value: cur, precision: 'day' })
        cur = cur.plus({ weeks: 1 })
      }
      break
    }

    case 'filter': {
      let cur = start
      while (cur.toMillis() <= end.toMillis()) {
        const dow = cur.weekday  // Luxon: 1=Mon … 7=Sun
        const keep = interval.filter === 'weekdays' ? dow <= 5 : dow >= 6
        if (keep) items.push({ type: 'datetime', value: cur, precision: 'day' })
        cur = cur.plus({ days: 1 })
      }
      break
    }
  }

  return items
}
