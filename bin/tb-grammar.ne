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
tbE -> tbP __ "^" __ tbE  {% (d) => Math.pow(d[0], d[4]) %}
     | tbP              {% id %}

# Multiplication and division
tbMD -> tbMD __ "*" __ tbE  {% (d) => d[0]*d[4] %}
      | tbMD __ "/" __ tbE  {% (d) => d[0]/d[4] %}
      | tbE               {% id %}

# Addition and subtraction
tbAS -> tbAS __ "+" __ tbMD {% (d) => d[0]+d[4] %}
      | tbAS __ "-" __ tbMD {% (d) => d[0]-d[4] %}
      | tbMD              {% id %}

# Time Point and Duration

tbTimePoint -> tbDate
#             #  | tbTime
#             #  | tbDate tbTime
#             #  | tbTime tbDate

tbDuration -> tbNumber _ tbTimeUnit      {% (d) => d[0] * d[2] %}


# Dates

tbDate -> tbYear tbDateSep tbMonth tbDateSep tbDay	{% (d) => d.join('') %}
        | tbMonth tbDateSep tbDay tbDateSep tbYear  {% (d) => d.join('') %}
        | tbDay tbDateSep tbMonth tbDateSep tbYear  {% (d) => d.join('') %}
        | tbYear   {% id %}
        # | tbMonth  {% id %}
        # | tbDay    {% id %}

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
         | "0" tbDigit {% (d) => d.join('') %}
         | "1" tbDigit {% (d) => d.join('') %}
		 | tbDigit     {% id %}

tbDay -> [0-3]:? tbDigit   {% (d) => d[0] + d[1] %}

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

tbDateSep -> [-/.] {% id %}


# Units

# Units constants in terms of milliseconds (because JS native epoch time is ms)
@{%
  const MS            = 1;
  const MS_PER_SEC    = MS * 1000;
  const MS_PER_MIN    = MS_PER_SEC * 60;
  const MS_PER_HR     = MS_PER_MIN * 60;
  const MS_PER_DAY    = MS_PER_HR * 24;
  const MS_PER_WEEK   = MS_PER_DAY * 7;
  const MS_PER_MONTH  = MS_PER_DAY * 30.4167; // on average, per Google
  const MS_PER_YEAR   = MS_PER_DAY * 365; // not counting leap year
  const MS_PER_MICRO  = MS / 1000;
  const MS_PER_NANO   = MS_PER_MICRO / 1000;
%}

tbTimeUnit -> tbMillis  {% () => MS %}
            | tbSecs    {% () => MS_PER_SEC %}
            | tbMins    {% () => MS_PER_MIN %}
            | tbHours   {% () => MS_PER_HR %}
            | tbDays    {% () => MS_PER_DAY %}
            | tbWeeks   {% () => MS_PER_WEEK %}
            | tbMonths  {% () => MS_PER_MONTH %}
            | tbYears   {% () => MS_PER_YEAR %}
            | tbMicros  {% () => MS_PER_MICRO %}
            | tbNanos   {% () => MS_PER_NANO %}


# TODO: i18n
tbMillis -> ("ms"i | "msec"i | "msecs"i | "millis"i | "millisecs"i)  {% id %}
tbSecs   -> ("s"i | "sec"i | "secs"i | "second"i | "seconds"i)       {% id %}
tbMins   -> ("m"i | "min"i | "mins"i | "minute"i | "minutes"i)       {% id %}
tbHours  -> ("h"i | "hr"i | "hrs"i | "hour"i | "hours"i)             {% id %}
tbDays   -> ("d"i | "dy"i | "dys"i | "day"i | "days"i)               {% id %}
tbWeeks  -> ("w"i | "wk"i | "wks"i | "week"i | "weeks"i)             {% id %}
tbMonths -> ("mn"i | "mon"i | "mons"i | "month"i | "months"i)        {% id %}
tbYears  -> ("y"i | "yr"i | "yrs"i | "year"i | "years"i)             {% id %}
tbMicros -> ("us"i | "usec"i | "usecs"i | "micro"i | "micros"i)      {% id %}
tbNanos  -> ("ns"i | "nsec"i | "nsecs"i | "nano"i | "nanos"i )       {% id %}

# Numbers
tbNumber -> tbInt             {% (d) => parseInt(d[0], 10) %}
          | tbDecimal         {% (d) => parseFloat(d[0]) %}
          | tbTimePoint       {% (d) => new Date(d[0]) %}
          | tbDuration        {% id %}

tbDecimal -> tbInt "." tbInt  {% (d) => d[0] + d[1] + d[2] %}
tbInt     -> tbDigit:+        {% (d) => d[0].join('') %}
tbDigit   -> [0-9]            {% id %}

# Whitespace. Postprocrssor is null-returning function for memory efficiency.
__ -> [\s]:+	{% () => null %}   # Mandatory whitespace.
_ -> [\s]:*   {% () => null %}	# Optional whitespace.
