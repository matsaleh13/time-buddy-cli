export type DurationUnit =
  | 'milliseconds'
  | 'seconds'
  | 'minutes'
  | 'hours'
  | 'days'
  | 'weeks'
  | 'months'
  | 'years'

export type CommandName = 'calc' | 'list' | 'count' | 'set'

export type BinOp = '+' | '-' | '*' | '/'

export type Keyword = 'now' | 'today' | 'tomorrow'

export interface RawTime {
  h: number
  m: number
  s: number
  ms: number
}

export interface RawDate {
  year: number
  month: number  // 1-12
  day: number
}

export type Node =
  | { kind: 'Number';   value: number }
  | { kind: 'Duration'; magnitude: number; unit: DurationUnit }
  | { kind: 'RawDate';  date: RawDate }
  | { kind: 'RawTime';  time: RawTime }
  | { kind: 'RawDatetime'; date: RawDate; time: RawTime }
  | { kind: 'Keyword';  word: Keyword }
  | { kind: 'BinOp';    op: BinOp; left: Node; right: Node }
  | { kind: 'Exp';      base: Node; exponent: Node }
  | { kind: 'Command';  name: CommandName; expr: Node }
