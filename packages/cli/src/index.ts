import { Command } from 'commander'
import { calc, format, toJSON, ParseError, EvalError } from '@time-buddy/core'
import type { FormatOptions, DurationUnit } from '@time-buddy/core'

const program = new Command()

program
  .name('tb')
  .description('Time buddy — date and time arithmetic')
  .version('0.2.0')
  .addHelpText('after', `
Examples:
  Date arithmetic
    tb 2026-06-01 - today          days until June 1
    tb now + 30d                   date 30 days from now
    tb 2026-05-21 - 2w             two weeks before a date
    tb 2026-01-01 + 3 months       three months after a date
    tb next monday                 date of next Monday
    tb last friday + 1w            a week after last Friday

  Duration arithmetic
    tb 1h + 45m                    sum of durations
    tb 2d * 3                      scale a duration
    tb "(1h + 30m) * 2"            use quotes for expressions with parens

  Timezone-aware datetimes
    tb 2026-01-15T14:30Z + 5d      UTC datetime arithmetic
    tb "2026-01-15T14:30+05:30 - 2026-01-15T09:00Z"   cross-tz diff

  Number arithmetic
    tb 2 ^ 10                      powers
    tb "(32 - 0) / 1.8"            general math

  Output formatting
    tb 2026-06-01 - today --decimal          decimal days
    tb 1h + 45m --in minutes                 express in minutes
    tb now + 30d --json                      JSON output

  Date formats accepted
    2026-01-15   01-15-2026   15 Jan 2026   January 15, 2026

  Time formats accepted
    14:30   14:30:45   3:30pm   10:00 AM

  Duration units accepted
    ms  s  m  h  d  w  mon  y  (and long forms: minutes, hours, days …)

  Keywords
    now   today   tomorrow   yesterday
    next/last/this week/month/year
    next/last monday … sunday`)

// Shared formatting options (added to both the default action and calc subcommand)
function addFormatOptions(cmd: Command): Command {
  return cmd
    .option('--decimal', 'express duration as a decimal in its natural unit')
    .option('--in <unit>', 'express duration in a specific unit (ms, s, m, h, d, w, mon, y, or long forms)')
    .option('--json', 'output result as JSON')
}

// Default command: calc (expression passed as variadic args)
addFormatOptions(
  program
    .argument('[expression...]', 'expression to evaluate')
).action((words: string[]) => {
  if (words.length === 0) {
    program.help()
    return
  }
  runCalc(words.join(' '), program.opts())
})

// Explicit calc subcommand
const calcCmd = addFormatOptions(
  program
    .command('calc <expression...>')
    .description('evaluate a time/date expression (default)')
).action((words: string[]) => runCalc(words.join(' '), calcCmd.opts()))

// Stubs for future commands
program
  .command('list <expression...>')
  .description('list time points matching an expression (not yet implemented)')
  .action(() => {
    console.error('tb list: not yet implemented')
    process.exit(1)
  })

program
  .command('count <expression...>')
  .description('count occurrences in an expression (not yet implemented)')
  .action(() => {
    console.error('tb count: not yet implemented')
    process.exit(1)
  })

program
  .command('set <key> <value>')
  .description('set a configuration option (not yet implemented)')
  .action(() => {
    console.error('tb set: not yet implemented')
    process.exit(1)
  })

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RunOpts {
  decimal?: boolean
  in?: string
  json?: boolean
}

function runCalc(input: string, opts: RunOpts = {}): void {
  try {
    const value = calc(input)

    const formatOpts: FormatOptions = {}
    if (opts.decimal) formatOpts.durationStyle = 'decimal'
    if (opts.in) {
      const unit = parseDurationUnit(opts.in)
      if (!unit) {
        console.error(`Unknown unit: "${opts.in}". Use: ms s m h d w mon y (or long forms).`)
        process.exit(1)
      }
      formatOpts.durationUnit = unit
    }

    if (opts.json) {
      console.log(JSON.stringify(toJSON(value, formatOpts)))
    } else {
      console.log(format(value, formatOpts))
    }
  } catch (err) {
    if (err instanceof ParseError) {
      console.error(`Parse error: ${err.message}`)
    } else if (err instanceof EvalError) {
      console.error(`Error: ${err.message}`)
    } else {
      console.error(String(err))
    }
    process.exit(1)
  }
}

/** Map common duration abbreviations and long names to a canonical DurationUnit. */
function parseDurationUnit(s: string): DurationUnit | null {
  const map: Record<string, DurationUnit> = {
    ms: 'milliseconds', msec: 'milliseconds', millisec: 'milliseconds',
    millisecond: 'milliseconds', milliseconds: 'milliseconds',
    s: 'seconds', sec: 'seconds', second: 'seconds', seconds: 'seconds',
    m: 'minutes', min: 'minutes', minute: 'minutes', minutes: 'minutes',
    h: 'hours', hr: 'hours', hour: 'hours', hours: 'hours',
    d: 'days', day: 'days', days: 'days',
    w: 'weeks', wk: 'weeks', week: 'weeks', weeks: 'weeks',
    mon: 'months', month: 'months', months: 'months',
    y: 'years', yr: 'years', year: 'years', years: 'years',
  }
  return map[s.toLowerCase()] ?? null
}

export { program }
