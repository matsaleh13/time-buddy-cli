# time-buddy Rewrite: Technical Design

## Overview

This document describes the technical design for the rewrite of time-buddy. The original implementation stalled due to grammar ambiguity in the Earley-based Nearley parser and a lack of clear separation between parsing and evaluation. This rewrite addresses those root causes with different foundational technology choices, and establishes a monorepo structure to support the long-term vision of CLI, web, desktop, and mobile apps sharing a common core.

---

## Goals

1. A clean, unambiguous parser for time/date/math expressions.
2. A well-typed evaluation engine with explicit type dispatch for operations.
3. A shared core library with zero platform dependencies, usable from any shell.
4. A thin CLI wrapper as the first user-facing product.
5. A monorepo structure ready to add a web calculator, Tauri desktop app, and Capacitor mobile app without restructuring.

---

## Technology Stack

| Concern | Choice | Rationale |
|---|---|---|
| Language | TypeScript | Required for the type-safe operation dispatch; runs natively in Node, browser, and any JS runtime |
| Package manager | pnpm | Best monorepo support; efficient disk use; strict dependency isolation |
| Parser | Ohm.js | PEG parser — deterministically unambiguous; cleanly separates grammar from semantic actions |
| Date/time | Luxon | First-class `DateTime` and `Duration` types; immutable; the right successor to moment.js |
| Test runner | Vitest | Fast, native TypeScript, compatible with Vite ecosystem for future web packages |
| CLI framework | Commander.js | Subcommand structure, help generation, clean option parsing |
| Web UI (future) | Svelte | Minimal bundle, compiles away at build time, excellent for a self-contained calculator widget |
| Desktop (future) | Tauri | Small native binary (~5-10MB), uses OS webview, Rust backend; wraps the Svelte web app |
| Mobile (future) | Capacitor | Wraps the same Svelte web app in a native iOS/Android shell |

---

## Why Ohm.js Over Nearley

The original project's core problem was grammar ambiguity: `2` is simultaneously the integer 2 and February; `2019/05/14` is either a date or a chain of divisions. Earley parsers (Nearley) return *all* valid interpretations, leaving the application to resolve them — which is difficult to do correctly and consistently.

Ohm.js uses Parsing Expression Grammars (PEG). PEG uses *ordered choice* — alternatives are tried in sequence, and the first match wins. Ambiguity is resolved by rule priority, not post-hoc disambiguation code. This is a better fit for a domain where priorities are well-defined (date patterns before numbers, durations before bare numbers).

Ohm also enforces a hard separation between grammar rules (structure) and semantic actions (meaning). The `.ohm` file contains only grammar; a TypeScript `Semantics` object defines what each rule produces. This is the separation the original project was trying to achieve organically.

---

## Repository Structure

```
time-buddy-cli/               ← repo root
  packages/
    core/                     ← shared library, zero platform deps
    cli/                      ← Node.js CLI, thin wrapper over core
    web/                      ← (future) Svelte calculator web app
    desktop/                  ← (future) Tauri wrapper
    mobile/                   ← (future) Capacitor wrapper
  doc/                        ← design documents
  scratch/                    ← archived original implementation
  pnpm-workspace.yaml
  package.json                ← monorepo root (no runtime deps)
  tsconfig.base.json          ← shared TS config
```

---

## `packages/core`

The heart of the project. Parses expressions and evaluates them. Has no knowledge of CLI, DOM, or any platform.

### Internal Structure

```
packages/core/src/
  grammar/
    tb.ohm          ← Ohm grammar file (structure only)
    parser.ts       ← feeds input to Ohm, applies semantics → AST
    ast.ts          ← AST node type definitions
  eval/
    types.ts        ← runtime Value types + DurationUnit enum
    operations.ts   ← type-pair dispatch table for arithmetic
    evaluator.ts    ← walks AST, produces Value
  index.ts          ← public API
```

### Grammar Design

The grammar is organized into layers. Ohm handles left-recursion natively, making PEMDAS straightforward:

```
Expression
  = Command spaces Expr   -- withCommand (e.g. "calc now + 5d")
  | Expr

Command = "calc"i | "list"i | "count"i | "set"i

Expr  (addition/subtraction, left-assoc)
Term  (multiplication/division, left-assoc)
Factor (exponentiation, right-assoc)
Primary = Paren | Duration | DateTime | Number | Keyword
```

**Disambiguation by ordering:** `Primary` tries alternatives in this order:
1. `Duration` (e.g. `5d`, `30 minutes`) — matched before bare numbers
2. `DateTime` (most specific formats first)
3. `Number` (bare integer or decimal)
4. `Keyword` (`now`, `today`, `tomorrow`)

**Whitespace rule:** Arithmetic operators (`+`, `-`, `*`, `/`) require surrounding whitespace. This is the cleanest way to prevent date separators (`2019/05/14`) from being misread as division. The original project independently arrived at this same conclusion.

**Date formats supported** (ordered most-specific to least):
- `YYYY-MM-DD`, `YYYY/MM/DD`
- `MM-DD-YYYY`, `MM/DD/YYYY`
- `DD MonthName YYYY` (e.g. `14 May 2019`)
- `MonthName DD, YYYY` (e.g. `May 14, 2019`)
- Combined datetime: `<date>T<time>` or `<date> <time>`

**Time formats:**
- `HH:MM:SS.mmm`, `HH:MM:SS`, `HH:MM` (24-hour)

**Duration formats:**
- `<number><unit>` (e.g. `5d`, `2h`, `30m`)
- `<number> <unit>` (e.g. `5 days`, `30 minutes`)

**Keywords:** `now`, `today`, `tomorrow` (case-insensitive; resolved to `DateTime` values at evaluation time, not parse time)

**Month names:** Full and abbreviated, case-insensitive (`January`, `Jan`, `january`, `jan`)

### AST Node Types

The AST describes *what the user wrote*, not *what it means*. All computation happens in the evaluator.

```typescript
export type Node =
  | { kind: 'Number';      value: number }
  | { kind: 'Duration';    magnitude: number; unit: DurationUnit }
  | { kind: 'RawDate';     year: number; month: number; day: number }
  | { kind: 'RawTime';     h: number; m: number; s: number; ms: number }
  | { kind: 'RawDatetime'; date: RawDate; time: RawTime }
  | { kind: 'Keyword';     word: 'now' | 'today' | 'tomorrow' }
  | { kind: 'BinOp';       op: '+' | '-' | '*' | '/'; left: Node; right: Node }
  | { kind: 'Exp';         base: Node; exponent: Node }
  | { kind: 'Command';     name: CommandName; expr: Node }

export type DurationUnit =
  | 'milliseconds' | 'seconds' | 'minutes' | 'hours'
  | 'days' | 'weeks' | 'months' | 'years'

export type CommandName = 'calc' | 'list' | 'count' | 'set'
```

### Runtime Value Types

What the evaluator produces:

```typescript
export type Value =
  | { type: 'number';   value: number }
  | { type: 'datetime'; value: DateTime }   // Luxon DateTime
  | { type: 'duration'; value: Duration }   // Luxon Duration
```

### Operation Dispatch

The evaluator looks up the operation by `(leftType, op, rightType)` and either applies it or throws a typed error. Legal combinations:

| Left type | Op | Right type | Result type |
|---|---|---|---|
| `datetime` | `+` | `duration` | `datetime` |
| `datetime` | `-` | `duration` | `datetime` |
| `datetime` | `-` | `datetime` | `duration` |
| `duration` | `+` | `duration` | `duration` |
| `duration` | `-` | `duration` | `duration` |
| `duration` | `*` | `number`   | `duration` |
| `duration` | `/` | `number`   | `duration` |
| `number`   | `*` | `duration` | `duration` |
| `number`   | any | `number`   | `number`   |

All other combinations produce a clear error: `"Cannot subtract a date from a number"`.

### Public API

```typescript
// Parse an input string to an AST (throws ParseError on invalid input)
export function parse(input: string): Node

// Evaluate an AST to a runtime value (throws EvalError on type mismatch)
export function evaluate(node: Node): Value

// Convenience: parse + evaluate in one call
export function calc(input: string): Value

// Format a Value for display
export function format(value: Value, options?: FormatOptions): string
```

### Known Hard Problems

- **Month arithmetic**: `2026-01-31 + 1 month`. January 31 plus one month has no exact answer. Luxon clamps to the last valid day of the month (Feb 28). This is documented behavior, not a bug.
- **Duration display**: When subtracting two dates, the result is a duration. Displaying it as `"3d 2h 15m"` vs `"3.094 days"` requires a formatting decision. `FormatOptions` will expose this.
- **`list` / `count` complexity**: "Every third Saturday" requires calendar logic beyond arithmetic. These commands are deferred; the evaluator architecture supports them via the `Command` AST node.

---

## `packages/cli`

A thin Commander.js wrapper. Contains no business logic.

```
packages/cli/src/
  index.ts          ← Commander setup, routes to core functions
bin/
  tb.js             ← #!/usr/bin/env node entry point
```

### Command Structure

```
tb [calc] <expression...>    ← default command, calls core.calc()
tb list <expression...>      ← not yet implemented
tb count <expression...>     ← not yet implemented
tb set <key> <value>         ← not yet implemented
```

The expression is assembled from variadic positional args (`process.argv` after command name), joined with spaces. This allows `tb now + 5d` without quoting.

Error handling: parse and eval errors are caught, printed cleanly to stderr, and exit with code 1.

---

## Future Packages

### `packages/web`

Svelte app. A calculator UI with:
- Display showing current input and result
- Button grid: digits, operators, date/time-specific keys (`d`, `h`, `m`, `s`, `now`, `today`)
- Calls `core.parse()` on every keystroke for live feedback; `core.calc()` on `=`

### `packages/desktop`

Tauri app. Wraps the Svelte web app. Provides:
- Native window, menu, file associations
- Optionally: keyboard shortcut to open from anywhere

### `packages/mobile`

Capacitor app. Wraps the same Svelte web app. Calculator UI is naturally touch-friendly.

---

## Implementation Plan

### Phase 1: Foundation (this session)

1. Archive `lib/`, `cli.js`, `bin/`, `test/` → `scratch/original/`
2. Create `pnpm-workspace.yaml`
3. Create root `package.json` and `tsconfig.base.json`
4. Scaffold `packages/core` with `package.json` and `tsconfig.json`
5. Write `src/grammar/tb.ohm`
6. Write `src/grammar/ast.ts`
7. Write `src/grammar/parser.ts` (Ohm semantics → AST)
8. Write `src/eval/types.ts`, `operations.ts`, `evaluator.ts`
9. Write `src/index.ts`
10. Write tests in `test/`
11. Run `pnpm test`, iterate until passing
12. Scaffold `packages/cli`
13. Write CLI, test end-to-end

### Phase 2: Complete `calc`

- Natural language keywords: `next week`, `last month`, etc.
- AM/PM time parsing
- Timezone support
- Richer output formatting options

### Phase 3: `list` and `count`

- Interval expressions: `every 2 weeks`, `every Monday`
- Range bounds: `from X to Y`, `until Y`
- Calendar-aware intervals (weekdays, weekends, specific days)

### Phase 4: Web UI

- Svelte calculator app
- Deploy to static hosting

### Phase 5: Desktop + Mobile

- Tauri wrapper for desktop
- Capacitor wrapper for mobile

---

## Verification (Phase 1)

```bash
pnpm --filter @time-buddy/core test      # all unit tests pass

# End-to-end CLI tests:
node packages/cli/bin/tb.js "2 + 2"
node packages/cli/bin/tb.js "now + 30d"
node packages/cli/bin/tb.js "2026-06-01 - now"
node packages/cli/bin/tb.js "1h + 45m"
node packages/cli/bin/tb.js "2d * 3"
node packages/cli/bin/tb.js "calc 2026-01-01 + 2w"
node packages/cli/bin/tb.js "(1h + 30m) * 2"
```
