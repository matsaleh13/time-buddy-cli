tbOperation -> tbCommand tbExpression
             | tbExpression

# TODO: i18n
tbCommand -> "calc"i  {% id %}
           | "list"i  {% id %}
           | "count"i {% id %}
           | "set"i   {% id %}

tbExpression -> tbValue tbBinaryOperator tbValue
              # | tbValue tbUnaryOperator
              # | tbUnaryOperator tbValue

tbBinaryOperator -> tbAdd
                  | tbSub
                  | tbMul
                  | tbDiv

tbAdd -> "+" {% id %}
tbSub -> "-" {% id %}
tbMul -> "*" {% id %}
tbDiv -> "/" {% id %}

tbValue -> tbNumber
         | tbTimePoint
         | tbDuration
        #  | tbVariable

# Time Point and Duration

tbTimePoint -> tbDate
            #  | tbTime
            #  | tbDate tbTime
            #  | tbTime tbDate

tbDuration -> tbNumber tbTimeUnit:?


# Dates

tbDate -> tbYear tbDateSep:? tbMonth tbDateSep:? tbDay
        # | tbMonth tbDateSep:? tbDay tbDateSep:? tbYear
        # | tbDay tbDateSep:? tbMonth tbDateSep:? tbYear
        # | tbYear
        # | tbMonth
        # | tbDay

tbYear -> tbDigit tbDigit tbDigit tbDigit {% (d) => d.join('') %}
        | tbDigit tbDigit                 {% (d) => d.join('') %}

tbMonth -> tbJan  {% id %}
         | tbFeb  {% id %}
         | tbMar  {% id %}
         | tbApr  {% id %}
         | tbMay  {% id %}
         | tbJun  {% id %}
         | tbJul  {% id %}
         | tbAug  {% id %}
         | tbSep  {% id %}
         | tbOct  {% id %}
         | tbNov  {% id %}
         | tbDec  {% id %}
         | "0":? [0-9]  {% ([d0, d1]) => d0 + d1 %}
         | "1" [0-9]    {% ([d0, d1]) => d0 + d1 %}

tbDay -> tbDigit tbDigit:?

# TODO: i18n
tbJan -> "January"i    | "Jan"i | "01" | "1"  {% id %}
tbFeb -> "February"i   | "Feb"i | "02" | "2"  {% id %}
tbMar -> "March"i      | "Mar"i | "03" | "3"  {% id %}
tbApr -> "April"i      | "Apr"i | "04" | "4"  {% id %}
tbMay -> "May"i        | "May"i | "05" | "5"  {% id %}
tbJun -> "June"i       | "Jun"i | "06" | "6"  {% id %}
tbJul -> "July"i       | "Jul"i | "07" | "7"  {% id %}
tbAug -> "August"i     | "Aug"i | "08" | "8"  {% id %}
tbSep -> "September"i  | "Sep"i | "09" | "9"  {% id %}
tbOct -> "October"i    | "Oct"i | "10" | "10" {% id %}
tbNov -> "November"i   | "Nov"i | "11" | "11" {% id %}
tbDec -> "December"i   | "Dec"i | "12" | "12" {% id %}

tbDateSep -> "-" {% id %}
           | "." {% id %}
           | "/" {% id %}

# Units

tbTimeUnit -> tbHours   {% id %}
            | tbMins    {% id %}
            | tbSecs    {% id %}
            | tbMillis  {% id %}
            | tbMicros  {% id %}
            | tbNanos   {% id %}

# TODO: i18n
tbHours -> "h"i       {% id %}
         | "hr"i      {% id %}
         | "hrs"i     {% id %}
         | "hour"i    {% id %}
         | "hours"i   {% id %}

tbMins -> ("m"i | "min"i | "mins"i | "minute"i | "minutes"i) {% id %}
tbSecs -> ("s"i | "sec"i | "secs"i | "second"i | "seconds"i) {% id %}
tbMillis -> ("ms"i | "msec"i | "msecs"i | "millis"i | "millisecond"i | "milliseconds"i) {% id %}
tbMicros -> ("us"i | "usec"i | "usecs"i | "micro"i | "micros"i | "microsec"i | "microsecs"i | "microsecond"i | "microseconds"i) {% id %}
tbNanos -> ("ns"i | "nsec"i | "nsecs"i | "nano"i | "nanos"i | "nanosec"i | "nanosecs"i | "nanosecond"i | "nanoseconds"i) {% id %}

tbDateUnit -> tbDays    {% id %}
            | tbWeeks   {% id %}
            | tbMonths  {% id %}
            | tbYears   {% id %}

# TODO: i18n
tbDays -> ("d"i | "dy"i | "dys"i | "day"i | "days"i)         {% id %}
tbWeeks -> ("w"i | "wk"i | "wks"i | "week"i | "weeks"i)      {% id %}
tbMonths -> ("m"i | "mon"i | "mons"i | "month"i | "months"i) {% id %}
tbYears -> ("y"i | "yr"i | "yrs"i | "year"i | "years"i)      {% id %}

# Numbers

tbNumber -> tbInt      {% (d) => parseInt(d[0], 10) %}
          | tbDecimal  {% (d) => parseFloat(d[0]) %}

tbDecimal -> tbInt "." tbInt  {% (d0, _, d1) => d0 + _ + d1 %}
tbInt -> tbDigit:+  {% (d) => d[0].join('') %}

tbDigit -> [0-9] {% id %}

# Whitespace. Postprocrssor is null-returning function for memory efficiency.
__ -> [\s]:+	{% nuller %}   # Mandatory whitespace.
_ -> [\s]:*   {% nuller %}	# Optional whitespace.
