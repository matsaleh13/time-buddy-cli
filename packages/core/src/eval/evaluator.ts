import { DateTime, Duration } from 'luxon'
import type { Node } from '../grammar/ast.js'
import type { Value } from './types.js'
import { EvalError } from './types.js'
import { applyBinOp, applyExp } from './operations.js'

export function evaluate(node: Node): Value {
  switch (node.kind) {
    case 'Number':
      return { type: 'number', value: node.value }

    case 'Duration': {
      return {
        type: 'duration',
        value: Duration.fromObject({ [node.unit]: node.magnitude }),
      }
    }

    case 'RawDate': {
      const { year, month, day } = node.date
      const dt = DateTime.local(year, month, day, 0, 0, 0, 0)
      if (!dt.isValid) throw new EvalError(`Invalid date: ${year}-${month}-${day}`)
      return { type: 'datetime', value: dt }
    }

    case 'RawTime': {
      const { h, m, s, ms } = node.time
      const now = DateTime.now()
      const dt = DateTime.local(now.year, now.month, now.day, h, m, s, ms)
      if (!dt.isValid) throw new EvalError(`Invalid time: ${h}:${m}:${s}.${ms}`)
      return { type: 'datetime', value: dt }
    }

    case 'RawDatetime': {
      const { year, month, day } = node.date
      const { h, m, s, ms } = node.time
      const dt = DateTime.local(year, month, day, h, m, s, ms)
      if (!dt.isValid) throw new EvalError(`Invalid datetime`)
      return { type: 'datetime', value: dt }
    }

    case 'Keyword': {
      const now = DateTime.now()
      switch (node.word) {
        case 'now':      return { type: 'datetime', value: now }
        case 'today':    return { type: 'datetime', value: now.startOf('day') }
        case 'tomorrow': return { type: 'datetime', value: now.startOf('day').plus({ days: 1 }) }
      }
    }

    case 'BinOp': {
      const left = evaluate(node.left)
      const right = evaluate(node.right)
      return applyBinOp(node.op, left, right)
    }

    case 'Exp': {
      const base = evaluate(node.base)
      const exp = evaluate(node.exponent)
      return applyExp(base, exp)
    }

    case 'Command':
      // For now, Command just evaluates its expression.
      // Future: route to specific command handlers (list, count, set).
      return evaluate(node.expr)
  }
}
