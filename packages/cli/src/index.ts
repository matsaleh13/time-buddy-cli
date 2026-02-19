import { Command } from 'commander'
import { calc, format, ParseError, EvalError } from '@time-buddy/core'

const program = new Command()

program
  .name('tb')
  .description('Time buddy — date and time arithmetic')
  .version('0.2.0')

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
