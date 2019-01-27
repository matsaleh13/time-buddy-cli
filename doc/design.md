# time-buddy-cli design document

## Overview

Time Buddy is a command line interface (CLI) tool for performing time operations in a natural way.

## Features

- Perform calculations with time points and durations:
  - Add or subtract a duration.
  - Difference between time points.
  - Difference between durations.
  - Multiply or divide a duration.
- Select recurring time points:
  - Starting from a time point.
  - Between two time points.
  - Using a duration-based interval.
  - Using a relative interval (e.g. "every third Saturday" or "third Saturday of each month").
- Conversion of duration units:
  - Integral units to/from decimal (e.g. h:m:s <-> s.sss)
- Support natural user interface:
  - Context-sensitive defaults for start/end times.
  - Context-sensitive defaults for time units.
  - Common time expressions, e.g. "now", "next", "between", "later", "after", etc.
  - Simple arithmetic calculation notation.
  - Intuitive time unit notation.
  - Use of standard and/or common time formats.
- Nice to have:
  - Extensible/pluggable.
  - Localized.

## Key Abstractions

- Time Point: Represents a single point in time.
- Duration: Represents elapsed time between two Time Points.
- Unit: The "size" of a Duration, e.g. "minutes", "days".
- Time Format: The presentation style of a single Time Point or Duration as text, including delimiters, order, decorators, units, and the like.
- Output Format: The data structure used for representing Time Buddy output for display or persistence, e.g. JSON, raw text, or similar.
- Statement: A keyword or other "unit of execution" that is interpreted by TimeBuddy to perform some operation.
- Expression: A collection of statements and values that returns a result.
- Operator: A type of `Statement` that requires one or more input arguments and produces a result. Examples:
  - Arithmetic operators: `+` `-` `*` `/`
  - Relational Operators: `before` `after` `first` `last` `between` `from` `to` `until` `this` `next` `prev`
  - Conversion Operators: `as` `to`
  - Selection Operators: `weekdays` `weekend` `workdays` `sundays|mondays|...|saturdays` `now` `today` `tomorrow`
- Commands: High level directives that invoke a specific type of operation or result:
  - `calc`: Perform arithmetic operations on Time Point or Duration input values in an `Expression` (default command).
  - `list`: Generate a list of Time Points using criteria defined in an `Expression`.
  - `count`: Calculate the number of Time Points to occur between Time Points specified by an `Expression`.
  - `set`: Set a configuration option.

## Sample Use Cases

- Difference between Time Points:
  > Statements in square brackets are optional or implied.

  ```shell
    $ tb [calc] 10/10/2019 - [now]
    127d 3h 37m 4.5s
  ```

- Add duration to a Time Point:

  ```shell
    $ tb [calc] [now] + 37d
    2019-01-20T13:06:17.821
  ```

- Subtract duration from a Time Point:

  ```shell
    $ tb [calc] 2019-05-21 - 2w
    2019-05-07T00:00:00.000
  ```

- Get the number of weeks left in the current year:

  ```shell
    $ tb count weeks until next year
    15.3
  ```

- Get the number of working hours left until a date:

  ```shell
    $ tb count working hours [until] 2019-4-1
    42.33
  ```

- List weekends between two dates:

  ```shell
    $ tb list weekend [days] [from] 3-15-2019 [to] 4-1-2019
    3-16-2019
    3-17-2019
    3-23-2019
    3-24-2019
    3-30-2019
    3-31-2019
  ```

- Set default output format to JSON:

  ```shell
    $ tb set outputFormat json
    outputFormat is now 'json'
  ```

## Technical Design

### Input

- Handled on the command line:
  - `Commands` are git-style.
  - `Options` are global and/or command-specific.
  - `Arguments` are anything after the options, usually `Expressions`.
- Optional input via stdin:
  - `Expressions` only.

### Expression Parsing

- `Expressions` are parsed to determine operations to perform.
- Use existing parser, e.g. [`nearly.js`](https://nearley.js.org/) (or other suitable choice TBD).
- Grammar should support natural language concepts.

### Date/Time Operations

- Use existing date/time package, e.g. [`moment`](https://momentjs.com/).

### Output

- Formats:
  - Text
  - JSON
  - XML (maybe?)
- To `stdout`.
- Optional --output file.

### State Management

- History file.
- Local "memory" file for last value.
- Additional "registers"?

### Configuration

- User config file in ~/.tbrc:
  - Default unit: year|month|day|week|hour|minute|second|natural
  - Default precision: decimal|truncate|natural
  - Default output format: JSON|text|rawtext
  - Default TimePoint format: (format string)
  - Default locale: (pick)
- Local config:
  - .tbrc in working dir.
  - Overrides global settings.
- Create by hand or via `set` command:
  - Sets local if exists, otherwise user.
