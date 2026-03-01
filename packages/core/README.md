# @time-buddy/core

Core parser and evaluator for [time-buddy](https://github.com/matsaleh13/time-buddy-cli) date/time expressions. This is the shared library used by the `time-buddy` CLI and any future platform packages.

## Install

```sh
npm install @time-buddy/core
```

## API

```ts
import { calc, parse, evaluate, format } from '@time-buddy/core'

// One-shot: parse + evaluate + format
calc('now + 30d')              // => '2026-03-31'

// Step by step
const ast = parse('1h + 45m')
const value = evaluate(ast)   // => { type: 'duration', value: Duration, precision: 'minute' }
format(value)                  // => '1h 45m'

// Format options
format(value, { durationStyle: 'decimal' })   // => '1.75 hours'
format(value, { durationUnit: 'minutes' })    // => '105m'
```

### `parse(input: string): Node`

Parses a time-buddy expression string into an AST. Throws `ParseError` on invalid input.

### `evaluate(node: Node): Value`

Evaluates an AST node into a `Value` (`number | datetime | duration | list`). Throws `EvalError` on type mismatches.

### `format(value: Value, opts?: FormatOptions): string`

Formats a `Value` as a human-readable string.

### `calc(input: string, opts?: FormatOptions): string`

Convenience wrapper: parse + evaluate + format in one call.

## License

MIT
