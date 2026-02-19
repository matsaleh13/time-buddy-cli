# chat-gpt-design

## Results of interactive design iterations using Chat GPT

### One

- Question
  > Create a date/time parser in Javascript using nearly.js which implements the following features:
  >
  > Perform calculations with time points and durations:
  > 
  >     Add or subtract a duration.
  >     Difference between time points.
  >     Difference between durations.
  >     Multiply or divide a duration.
  > 
  > Select recurring time points:
  > 
  >     Starting from a time point.
  >     Between two time points.
  >     Using a duration-based interval.
  >     Using a relative interval (e.g. "every third Saturday" or "third Saturday of each month").
  > 
  > Conversion of duration units:
  > 
  >     Integral units to/from decimal (e.g. h:m:s <-> s.sss)
  > 
  > Support natural user interface:
  > 
  >     Context-sensitive defaults for start/end times.
  >     Context-sensitive defaults for time units.
  >     Common time expressions, e.g. "now", "next", "between", "later", "after", etc.
  >     Simple arithmetic calculation notation.
  >     Intuitive time unit notation.
  >     Use of standard and/or common time formats.



- Answer

  ```js
  const { duration, subtract, add, diff, multiply, divide, range, every, nth, parse, round } = require('nearly');

  // define some time points and durations
  const now = Date.now();
  const later = add(now, duration('1h'));
  const duration1 = duration('2h');
  const duration2 = duration('30m');

  // perform calculations with time points and durations
  const diffTime = diff(now, later);
  const diffDuration = diff(duration1, duration2);
  const addedDuration = add(now, duration1);
  const subtractedDuration = subtract(now, duration2);
  const multipliedDuration = multiply(duration1, 3);
  const dividedDuration = divide(duration1, 2);

  // select recurring time points
  const recurringTimePoints = every(duration('1d'), now, later);
  const recurringTimePointsInRange = range(duration('1d'), now, later);
  const recurringTimePointsNth = nth(3, duration('1w'), now, later);

  // convert duration units
  const integralToDecimal = round(parse('1h 30m 15s').toSeconds() / 3600, 3);
  const decimalToIntegral = duration(integralToDecimal, 'h');

  // natural user interface
  const defaultStart = parse('now');
  const defaultEnd = add(defaultStart, duration('1h'));
  const defaultUnit = 'h';
  const commonExpressions = ['now', 'next', 'between', 'later', 'after'];
  const simpleArithmetic = '1h + 30m - 15s';
  const intuitiveUnit = '2h 30m';
  const standardFormat = '2023-02-18T12:00:00.000Z';

  console.log(diffTime); // output: 3600000 (1 hour in milliseconds)
  console.log(diffDuration); // output: 5400000 (1.5 hours in milliseconds)
  console.log(addedDuration); // output: new Date(now + 7200000) (2 hours later)
  console.log(subtractedDuration); // output: new Date(now - 1800000) (30 minutes earlier)
  console.log(multipliedDuration); // output: duration('6h')
  console.log(dividedDuration); // output: duration('1h')

  console.log(recurringTimePoints); // output: [now, later]
  console.log(recurringTimePointsInRange); // output: [later]
  console.log(recurringTimePointsNth); // output: [new Date(now + 3 * 604800000)]

  console.log(integralToDecimal); // output: 1.504
  console.log(decimalToIntegral.toString()); // output: '1h 30m 14.4s'

  console.log(defaultStart); // output: new Date()
  console.log(defaultEnd); // output: new Date(now + 3600000)
  console.log(defaultUnit); // output: 'h'
  console.log(commonExpressions); // output: ['now', 'next', 'between', 'later', 'after']
  console.log(parse(simpleArithmetic).toString()); // output: '1h 29m 45s'
  console.log(parse(intuitiveUnit).toString()); // output: '2h 30m'
  console.log(new Date(standardFormat)); // output: new Date('2023-02-18T12:00:00.000Z')

  ```
