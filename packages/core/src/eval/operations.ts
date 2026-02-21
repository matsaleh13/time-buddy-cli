import { Duration } from 'luxon'
import type { Value } from './types.js'
import { EvalError, precisionFiner } from './types.js'
import type { BinOp } from '../grammar/ast.js'

type DatetimeValue = Extract<Value, { type: 'datetime' }>
type DurationValue = Extract<Value, { type: 'duration' }>

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

    // datetime ± duration → datetime; precision comes from the duration
    // (the duration's unit determines the meaningful step size of the result)
    case 'datetime + duration': {
      const l = left  as DatetimeValue
      const r = right as DurationValue
      return { type: 'datetime', value: l.value.plus(r.value), precision: r.precision }
    }
    case 'datetime - duration': {
      const l = left  as DatetimeValue
      const r = right as DurationValue
      return { type: 'datetime', value: l.value.minus(r.value), precision: r.precision }
    }

    // datetime - datetime → duration; show the finer of the two input precisions
    case 'datetime - datetime': {
      const l = left  as DatetimeValue
      const r = right as DatetimeValue
      return {
        type: 'duration',
        value: l.value.diff(r.value, ['days', 'hours', 'minutes', 'seconds', 'milliseconds']),
        precision: precisionFiner(l.precision, r.precision),
      }
    }

    // duration ± duration → finer precision (show all detail present in either operand)
    case 'duration + duration': {
      const l = left  as DurationValue
      const r = right as DurationValue
      return { type: 'duration', value: l.value.plus(r.value),  precision: precisionFiner(l.precision, r.precision) }
    }
    case 'duration - duration': {
      const l = left  as DurationValue
      const r = right as DurationValue
      return { type: 'duration', value: l.value.minus(r.value), precision: precisionFiner(l.precision, r.precision) }
    }

    // duration scaled by a number — precision stays with the duration
    case 'duration * number': {
      const l = left as DurationValue
      return { type: 'duration', value: l.value.mapUnits(v => v * (right.value as number)), precision: l.precision }
    }
    case 'number * duration': {
      const r = right as DurationValue
      return { type: 'duration', value: r.value.mapUnits(v => v * (left.value as number)),  precision: r.precision }
    }
    case 'duration / number': {
      const l = left as DurationValue
      const d = right.value as number
      if (d === 0) throw new EvalError('Division by zero')
      return { type: 'duration', value: l.value.mapUnits(v => v / d), precision: l.precision }
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
