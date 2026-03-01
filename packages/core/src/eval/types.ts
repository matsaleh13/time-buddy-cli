import type { DateTime, Duration } from 'luxon'

export type Precision = 'millisecond' | 'second' | 'minute' | 'hour' | 'day'

// Rank 0 = finest (millisecond), rank 4 = coarsest (day)
export const PRECISION_RANK: Record<Precision, number> = {
  millisecond: 0,
  second:      1,
  minute:      2,
  hour:        3,
  day:         4,
}

export function precisionFiner(a: Precision, b: Precision): Precision {
  return PRECISION_RANK[a] <= PRECISION_RANK[b] ? a : b
}

export type DatetimeValue = { type: 'datetime'; value: DateTime; precision: Precision }

export type Value =
  | { type: 'number';   value: number }
  | DatetimeValue
  | { type: 'duration'; value: Duration; precision: Precision }
  | { type: 'list'; items: DatetimeValue[] }

export class EvalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EvalError'
  }
}
