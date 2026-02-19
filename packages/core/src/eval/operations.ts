import { Duration } from 'luxon'
import type { Value } from './types.js'
import { EvalError } from './types.js'
import type { BinOp } from '../grammar/ast.js'

export function applyBinOp(op: BinOp, left: Value, right: Value): Value {
  const pair = `${left.type} ${op} ${right.type}`

  switch (pair) {
    // number arithmetic
    case 'number + number': return { type: 'number', value: (left.value as number) + (right.value as number) }
    case 'number - number': return { type: 'number', value: (left.value as number) - (right.value as number) }
    case 'number * number': return { type: 'number', value: (left.value as number) * (right.value as number) }
    case 'number / number': {
      const divisor = right.value as number
      if (divisor === 0) throw new EvalError('Division by zero')
      return { type: 'number', value: (left.value as number) / divisor }
    }

    // datetime ± duration — types guaranteed by the matched pair string
    case 'datetime + duration': {
      const dt = (left as { type: 'datetime'; value: import('luxon').DateTime }).value
      const dur = (right as { type: 'duration'; value: import('luxon').Duration }).value
      return { type: 'datetime', value: dt.plus(dur) }
    }
    case 'datetime - duration': {
      const dt = (left as { type: 'datetime'; value: import('luxon').DateTime }).value
      const dur = (right as { type: 'duration'; value: import('luxon').Duration }).value
      return { type: 'datetime', value: dt.minus(dur) }
    }

    // datetime - datetime → duration (flat days, not calendar months, per design doc)
    case 'datetime - datetime': {
      const l = (left as { type: 'datetime'; value: import('luxon').DateTime }).value
      const r = (right as { type: 'datetime'; value: import('luxon').DateTime }).value
      return { type: 'duration', value: l.diff(r, ['days', 'hours', 'minutes', 'seconds', 'milliseconds']) }
    }

    // duration arithmetic
    case 'duration + duration': {
      const l = (left as { type: 'duration'; value: import('luxon').Duration }).value
      const r = (right as { type: 'duration'; value: import('luxon').Duration }).value
      return { type: 'duration', value: l.plus(r) }
    }
    case 'duration - duration': {
      const l = (left as { type: 'duration'; value: import('luxon').Duration }).value
      const r = (right as { type: 'duration'; value: import('luxon').Duration }).value
      return { type: 'duration', value: l.minus(r) }
    }

    // duration * number or number * duration
    case 'duration * number': {
      const l = (left as { type: 'duration'; value: import('luxon').Duration }).value
      return { type: 'duration', value: l.mapUnits(v => v * (right.value as number)) }
    }
    case 'number * duration': {
      const r = (right as { type: 'duration'; value: import('luxon').Duration }).value
      return { type: 'duration', value: r.mapUnits(v => v * (left.value as number)) }
    }

    // duration / number
    case 'duration / number': {
      const l = (left as { type: 'duration'; value: import('luxon').Duration }).value
      const d = right.value as number
      if (d === 0) throw new EvalError('Division by zero')
      return { type: 'duration', value: l.mapUnits(v => v / d) }
    }
  }

  throw new EvalError(
    `Cannot apply '${op}' to ${left.type} and ${right.type}`
  )
}

export function applyExp(base: Value, exp: Value): Value {
  if (base.type !== 'number' || exp.type !== 'number') {
    throw new EvalError(`Exponentiation only works on numbers, got ${base.type} ^ ${exp.type}`)
  }
  return { type: 'number', value: Math.pow(base.value, exp.value) }
}
