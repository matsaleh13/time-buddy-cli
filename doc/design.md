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

## Key Abstractions

- Time Point: Represents a single point in time.
- Duration: Represents elapsed time between two Time Points.
- Time Unit: The "size" of a Duration, e.g. "minutes", "days".

## Sample Use Cases

- Difference between Time Points:

  ```shell
    $ tb 10/10/2019 - now
    => 127d 3h 37m 4.5s
  ```

- Add duration to a Time Point:

  ```shell
    $ tb now + 37d
    => 2019-01-20T13:06:17.821
  ```

- Subtract duration from a Time Point:

  ```shell
    $ tb 2019-05-21 - 2w
    => 2019-05-07T00:00:00.000
  ```


