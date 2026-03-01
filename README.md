# time-buddy

Date and time arithmetic on the command line.

```
tb 2026-06-01 - today          days until June 1
tb now + 30d                   date 30 days from now
tb 1h + 45m                    sum of durations
tb list weekdays from 2026-03-01 to 2026-03-31
tb count every monday from today to 2026-12-31
```

## Install

```sh
npm install -g time-buddy
```

Requires Node.js 18 or later.

## Usage

```
tb [expression]
tb calc [expression]
tb list [expression]
tb count [expression]
```

### Date arithmetic

```sh
tb 2026-06-01 - today          # days until a date
tb now + 30d                   # 30 days from now
tb 2026-05-21 - 2w             # two weeks before a date
tb 2026-01-01 + 3 months       # three months after a date
tb next monday                 # date of next Monday
tb last friday + 1w            # a week after last Friday
```

### Duration arithmetic

```sh
tb 1h + 45m                    # sum of durations
tb 2d * 3                      # scale a duration
tb "(1h + 30m) * 2"            # parens (quote the expression)
```

### List and count

```sh
tb list every monday from 2026-01-01 to 2026-03-31   # all Mondays in Q1
tb list weekdays from 2026-03-01 to 2026-03-31        # all weekdays in March
tb list weekends from 2026-03-01 to 2026-03-31        # all weekend days
tb count weekdays from 2026-03-01 to 2026-03-31       # how many weekdays?
tb count every 2w from today to next year             # every 2-week mark
```

### Timezone-aware datetimes

```sh
tb 2026-01-15T14:30Z + 5d
tb "2026-01-15T14:30+05:30 - 2026-01-15T09:00Z"
```

### Output formatting

```sh
tb 2026-06-01 - today --decimal    # decimal days (e.g. 92.5d)
tb 1h + 45m --in minutes           # express in a specific unit
tb now + 30d --json                # JSON output
```

## Input formats

| Type | Examples |
|---|---|
| Dates | `2026-01-15`, `01-15-2026`, `15 Jan 2026`, `January 15, 2026` |
| Times | `14:30`, `14:30:45`, `3:30pm`, `10:00 AM` |
| Datetimes | `2026-01-15T14:30`, `2026-01-15T14:30:00Z`, `2026-01-15T14:30+05:30` |
| Durations | `30d`, `2 weeks`, `1h 30m`, `90s`, `500ms` |
| Keywords | `now`, `today`, `tomorrow`, `yesterday` |
| Relative | `next/last/this week/month/year`, `next/last monday…sunday` |

## Duration units

`ms` `s` `m` `h` `d` `w` `mon` `y` — and long forms: `milliseconds`, `seconds`, `minutes`, `hours`, `days`, `weeks`, `months`, `years`

## License

MIT
