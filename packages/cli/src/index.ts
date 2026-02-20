import { Command } from 'commander'
import { calc, format, ParseError, EvalError } from '@time-buddy/core'

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

  Duration arithmetic
    tb 1h + 45m                    sum of durations
    tb 2d * 3                      scale a duration
    tb "(1h + 30m) * 2"            use quotes for expressions with parens

  Number arithmetic
    tb 2 ^ 10                      powers
    tb "(32 - 0) / 1.8"            general math

  Date formats accepted
    2026-01-15   01-15-2026   15 Jan 2026   January 15, 2026

  Duration units accepted
    ms  s  m  h  d  w  mon  y  (and long forms: minutes, hours, days …)

  Keywords
    now   today   tomorrow`)

// Default command: calc (expression passed as variadic args)
program
  .argument('[expression...]', 'expression to evaluate')
  .action((words: string[]) => {
    if (words.length === 0) {
      program.help()
      return
    }
    runCalc(words.join(' '))
  })

// Explicit calc subcommand
program
  .command('calc <expression...>')
  .description('evaluate a time/date expression (default)')
  .action((words: string[]) => runCalc(words.join(' ')))

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

function runCalc(input: string): void {
  try {
    const value = calc(input)
    console.log(format(value))
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

export { program }
