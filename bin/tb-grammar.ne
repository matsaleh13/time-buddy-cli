main -> tbCommand __ tbExpression _  {% (d) => d[0] + ' ' + d[1] %}
      | tbExpression                 {% (d) => d[0] %}

tbExpression -> _ tbAS _ {% (d) => d[1] %}

# TODO: i18n
tbCommand -> "calc"i  {% id %}
           | "list"i  {% id %}
           | "count"i {% id %}
           | "set"i   {% id %}

# PEMDAS!
# We define each level of precedence as a nonterminal.

# Parentheses
tbP -> "(" _ tbAS _ ")" {% (d) => d[2] %}
     | tbNumber         {% id %}

# Exponents
tbE -> tbP _ "^" _ tbE  {% (d) => Math.pow(d[0], d[4]) %}
     | tbP              {% id %}

# Multiplication and division
tbMD -> tbMD _ "*" _ tbE  {% (d) => d[0]*d[4] %}
      | tbMD _ "/" _ tbE  {% (d) => d[0]/d[4] %}
      | tbE               {% id %}

# Addition and subtraction
tbAS -> tbAS _ "+" _ tbMD {% (d) => d[0]+d[4] %}
      | tbAS _ "-" _ tbMD {% (d) => d[0]-d[4] %}
      | tbMD              {% id %}

# Time Point and Duration

tbTimePoint -> tbDate
#             #  | tbTime
#             #  | tbDate tbTime
#             #  | tbTime tbDate

# tbDuration -> tbNumber tbTimeUnit:?


# Dates

tbDate -> tbYear tbDateSep:? tbMonth tbDateSep:? tbDay
#         # | tbMonth tbDateSep:? tbDay tbDateSep:? tbYear
#         # | tbDay tbDateSep:? tbMonth tbDateSep:? tbYear
#         # | tbYear
#         # | tbMonth
#         # | tbDay

tbYear -> [0-9] [0-9] [0-9] [0-9] {% (d) => d.join('') %}
        | [0-9] [0-9]             {% (d) => d.join('') %}

tbMonth -> tbJan  {% id %}
#          | tbFeb  {% id %}
#          | tbMar  {% id %}
#          | tbApr  {% id %}
#          | tbMay  {% id %}
#          | tbJun  {% id %}
#          | tbJul  {% id %}
#          | tbAug  {% id %}
#          | tbSep  {% id %}
#          | tbOct  {% id %}
#          | tbNov  {% id %}
#          | tbDec  {% id %}
#          | "0":? [0-9]  {% (d) => d[0] + d[1] %}
#          | "1" [0-9]    {% (d) => d[0] + d[1] %}

tbDay -> tbDigit tbDigit:?

# TODO: i18n
tbJan -> "January"i    | "Jan"i | "01" | "1"  {% id %}
# tbFeb -> "February"i   | "Feb"i | "02" | "2"  {% id %}
# tbMar -> "March"i      | "Mar"i | "03" | "3"  {% id %}
# tbApr -> "April"i      | "Apr"i | "04" | "4"  {% id %}
# tbMay -> "May"i        | "May"i | "05" | "5"  {% id %}
# tbJun -> "June"i       | "Jun"i | "06" | "6"  {% id %}
# tbJul -> "July"i       | "Jul"i | "07" | "7"  {% id %}
# tbAug -> "August"i     | "Aug"i | "08" | "8"  {% id %}
# tbSep -> "September"i  | "Sep"i | "09" | "9"  {% id %}
# tbOct -> "October"i    | "Oct"i | "10" | "10" {% id %}
# tbNov -> "November"i   | "Nov"i | "11" | "11" {% id %}
# tbDec -> "December"i   | "Dec"i | "12" | "12" {% id %}

tbDateSep -> "-" {% id %}
           | "." {% id %}
           | "/" {% id %}

# Units

# tbTimeUnit -> tbHours   {% id %}
#             | tbMins    {% id %}
#             | tbSecs    {% id %}
#             | tbMillis  {% id %}
#             | tbMicros  {% id %}
#             | tbNanos   {% id %}

# TODO: i18n
# tbHours -> "h"i       {% id %}
#          | "hr"i      {% id %}
#          | "hrs"i     {% id %}
#          | "hour"i    {% id %}
#          | "hours"i   {% id %}

# tbMins -> ("m"i | "min"i | "mins"i | "minute"i | "minutes"i) {% id %}
# tbSecs -> ("s"i | "sec"i | "secs"i | "second"i | "seconds"i) {% id %}
# tbMillis -> ("ms"i | "msec"i | "msecs"i | "millis"i | "millisecond"i | "milliseconds"i) {% id %}
# tbMicros -> ("us"i | "usec"i | "usecs"i | "micro"i | "micros"i | "microsec"i | "microsecs"i | "microsecond"i | "microseconds"i) {% id %}
# tbNanos -> ("ns"i | "nsec"i | "nsecs"i | "nano"i | "nanos"i | "nanosec"i | "nanosecs"i | "nanosecond"i | "nanoseconds"i) {% id %}

# tbDateUnit -> tbDays    {% id %}
#             | tbWeeks   {% id %}
#             | tbMonths  {% id %}
#             | tbYears   {% id %}

# TODO: i18n
# tbDays -> ("d"i | "dy"i | "dys"i | "day"i | "days"i)         {% id %}
# tbWeeks -> ("w"i | "wk"i | "wks"i | "week"i | "weeks"i)      {% id %}
# tbMonths -> ("m"i | "mon"i | "mons"i | "month"i | "months"i) {% id %}
# tbYears -> ("y"i | "yr"i | "yrs"i | "year"i | "years"i)      {% id %}

# Numbers
tbNumber -> tbInt       {% (d) => parseInt(d[0], 10) %}
          | tbDecimal   {% (d) => parseFloat(d[0]) %}
          # | tbTimePoint {% id %}
          # | tbDuration  {% id %}

tbDecimal -> tbInt "." tbInt  {% (d) => d[0] + d[1] + d[2] %}
tbInt -> tbDigit:+  {% (d) => d[0].join('') %}

tbDigit -> [0-9] {% id %}

# Whitespace. Postprocrssor is null-returning function for memory efficiency.
__ -> [\s]:+	{% () => null %}   # Mandatory whitespace.
_ -> [\s]:*   {% () => null %}	# Optional whitespace.
