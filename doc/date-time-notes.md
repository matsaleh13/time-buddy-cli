# Date and Time Notes

## Date/Time creation

- `new Date()` => current local time
- `new Date(epoch_time)` => local time for the given epoch_time (UTC)
- `new Date(year, monthIdx, day, hours, minutes, seconds, milliseconds)` => local time
  - Input params assumed to be local time, *not* UTC.
  - Only year and monthIdx are required; remaining optional.
- `Date.UTC(year, monthIdx, day, hours, minutes, seconds, milliseconds)`
  - Like the Date ctor with the same signature, but input params assumed to be UTC.
- `new Date(date_time_string)` => time parsed from date_time_string (converted to UTC if not already).
  - May be date+time or just date, but never just time.
  - Strongly discouraged because of platform-dependent parsing implementation differences.
  - ISO 8601 date-only strings are interpreted as UTC, not local

## Output Formats

- `new Date().toString()` => local time string
- `new Date().toLocaleString()` => (local) time string, formatted for the current locale
- `new Date().toUTCString()` => UTC time string

## Epoch Timestamps

- `new Date().valueOf()` => epoch timestamp (UTC)
- `new Date().getTime()` => epoch timestamp (UTC)
- `Date.now()` => current epoch timestamp (UTC) (static)

## Resources

- [MDN Web Docs - Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [Understanding Date and Time in JavaScript](https://www.digitalocean.com/community/tutorials/understanding-date-and-time-in-javascript)
