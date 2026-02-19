import type { DateTime, Duration } from 'luxon'

export type Value =
  | { type: 'number';   value: number }
  | { type: 'datetime'; value: DateTime }
  | { type: 'duration'; value: Duration }

export class EvalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EvalError'
  }
}
