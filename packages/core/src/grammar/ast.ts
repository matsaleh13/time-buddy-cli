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

export type Keyword = 'now' | 'today' | 'tomorrow' | 'yesterday'

export type RelativeDirection = 'next' | 'last' | 'this'

export type CalendarUnit = 'day' | 'week' | 'month' | 'year'

export type Weekday =
  | 'monday' | 'tuesday' | 'wednesday' | 'thursday'
  | 'friday' | 'saturday' | 'sunday'

export type DayFilter = 'weekdays' | 'weekends'

export type ListInterval =
  | { kind: 'duration'; magnitude: number; unit: DurationUnit }
  | { kind: 'weekday'; weekday: Weekday }
  | { kind: 'filter'; filter: DayFilter }

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
  | { kind: 'RawDatetime'; date: RawDate; time: RawTime; tz?: number }
  | { kind: 'Keyword';  word: Keyword }
  | { kind: 'RelativeDate'; direction: RelativeDirection; unit: CalendarUnit }
  | { kind: 'RelativeWeekday'; direction: 'next' | 'last'; weekday: Weekday }
  | { kind: 'BinOp';    op: BinOp; left: Node; right: Node }
  | { kind: 'Exp';      base: Node; exponent: Node }
  | { kind: 'Command';  name: CommandName; expr: Node }
  | { kind: 'ListExpr'; interval: ListInterval; from: Node; to: Node }
