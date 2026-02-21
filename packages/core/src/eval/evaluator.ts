import { DateTime, Duration } from 'luxon'
import type { Node, DurationUnit } from '../grammar/ast.js'
import type { Value, Precision } from './types.js'
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
      const dt = DateTime.local(year, month, day, h, m, s, ms)
      if (!dt.isValid) throw new EvalError(`Invalid datetime`)
      return { type: 'datetime', value: dt, precision: precisionFromTime(s, ms) }
    }

    case 'Keyword': {
      const now = DateTime.now()
      switch (node.word) {
        case 'now':      return { type: 'datetime', value: now,                             precision: 'millisecond' }
        case 'today':    return { type: 'datetime', value: now.startOf('day'),              precision: 'day' }
        case 'tomorrow': return { type: 'datetime', value: now.startOf('day').plus({ days: 1 }), precision: 'day' }
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

    case 'Command':
      return evaluate(node.expr)
  }
}
