# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install                              # install all workspace dependencies
pnpm test                                 # run all tests across all packages
pnpm build                                # build all packages

pnpm --filter @time-buddy/core test       # run core tests only
pnpm --filter @time-buddy/core test:watch # watch mode
pnpm --filter @time-buddy/core build      # build core (tsc + copies tb.ohm to dist/)

pnpm --filter @time-buddy/cli build       # build CLI
node packages/cli/bin/tb.js "now + 5d"   # run CLI directly (after building)
```

Single test: add `.only` to the `it()` call, or use `--grep`:
```bash
pnpm --filter @time-buddy/core exec vitest run --grep "parses addition"
```

## Architecture

**time-buddy** is a date/time arithmetic tool. The long-term vision is CLI + web calculator + desktop (Tauri) + mobile (Capacitor), all sharing a common core library.

### Monorepo structure

```
packages/
  core/    ← shared library — parser, evaluator, formatter. Zero platform deps.
  cli/     ← Node.js CLI, thin Commander.js wrapper over core
  web/     ← (future) Svelte calculator UI
  desktop/ ← (future) Tauri wrapper
  mobile/  ← (future) Capacitor wrapper
```

### Core library pipeline

```
Input string
  → parse()     packages/core/src/grammar/parser.ts   string → AST
  → evaluate()  packages/core/src/eval/evaluator.ts   AST → Value
  → format()    packages/core/src/index.ts            Value → string
```

### Key files

- **`packages/core/src/grammar/tb.ohm`** — Ohm PEG grammar. Edit this to change what syntax is accepted. Uppercase rules are *syntactic* (auto-skip whitespace); lowercase are *lexical* (explicit spaces). After editing, run `pnpm --filter @time-buddy/core build` to copy it to `dist/`.
- **`packages/core/src/grammar/parser.ts`** — Ohm semantics that map grammar matches to AST nodes. Each rule alternative has a corresponding `ruleName_altName(...)` action; parameter count must exactly match the number of elements in the grammar rule body.
- **`packages/core/src/grammar/ast.ts`** — AST node type definitions (`Node` union type).
- **`packages/core/src/eval/types.ts`** — Runtime `Value` union type (`number | datetime | duration`). Also defines `Precision = 'millisecond' | 'second' | 'minute' | 'hour' | 'day'` with rank helpers `precisionCoarser` / `precisionFiner`. `datetime` and `duration` Values carry a required `precision` field.
- **`packages/core/src/eval/operations.ts`** — Type-pair dispatch table for binary operations. Defines what combinations are legal, their result types, and their result precision (e.g. `datetime ± duration` inherits the duration's precision; `datetime − datetime` takes the finer of both).
- **`packages/core/src/eval/evaluator.ts`** — Walks the AST and produces a `Value` with precision. Precision is inferred from the leaf node: `RawDate`/`today`/`tomorrow` → `'day'`; `now` → `'millisecond'`; `Duration` unit maps directly; `RawTime`/`RawDatetime` infer from non-zero s/ms fields.
- **`packages/core/src/index.ts`** — Public API: `parse()`, `evaluate()`, `calc()`, `format()`. The `format()` function uses the `precision` field to control output detail: datetimes truncate at the precision level; durations suppress finer units than the cutoff.

### Grammar design notes

- **Syntactic vs lexical rules**: `Expr`, `Term`, `Factor`, `Primary`, `Expression`, `Command` are syntactic (uppercase) — whitespace is auto-skipped between elements, so no explicit `spaces` in arithmetic rules. `date`, `time`, `datetime`, `duration`, `number`, `keyword` etc. are lexical (lowercase) — explicit `" "` where spaces are expected.
- **Disambiguation by priority**: `Primary` tries `duration` before `datetime` before `keyword` before `number`. Date formats are tried most-specific-first (4-digit year before 2-digit).
- **Ohm action arity**: The number of parameters in a semantic action must exactly match the number of elements in the grammar rule alternative. Helper rules (`fourDigits`, `twoDigits`, `oneOrTwoDigits`) are only used for their `sourceString`; `toAST()` is never called on them directly.
- **Date subtraction** internally diffs in flat `[days, hours, minutes, seconds, milliseconds]`. The formatter then calls `shiftTo` over all units (including months/weeks) so the display may show `1mo 3d` rather than `31d` — this is expected Luxon behavior.

### Type system

| Left | Op | Right | Result |
|---|---|---|---|
| `datetime` | `+` or `-` | `duration` | `datetime` |
| `datetime` | `-` | `datetime` | `duration` |
| `duration` | `+` or `-` | `duration` | `duration` |
| `duration` or `number` | `*` | `number` or `duration` | `duration` |
| `duration` | `/` | `number` | `duration` |
| `number` | any | `number` | `number` |

All other combinations throw `EvalError`.

### Precision inference

Output precision is inferred automatically — no user option needed. The rules:

| Operation | Result precision |
|---|---|
| `datetime ± duration` | duration's precision |
| `datetime − datetime` | finer of both |
| `duration ± duration` | finer of both |
| `duration * number` | duration's precision |

Precision controls datetime display (`'day'` → `yyyy-MM-dd`; `'hour'/'minute'` → `HH:mm`; `'second'` → `HH:mm:ss`; `'millisecond'` → `HH:mm:ss.SSS`) and duration display (only units at or coarser than the precision are shown).

### Design documents

- `doc/design.md` — original feature spec and use cases (still the source of truth for UX)
- `doc/rewrite-design.md` — technical design for this rewrite
