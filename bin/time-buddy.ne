tbOperation -> tbCommand tbExpression
             | tbExpression

tbCommand -> "calc"  {% id %}
           | "list"  {% id %}
           | "count" {% id %}
           | "set"   {% id %}

tbExpression -> tbValue tbBinaryOperator tbValue
              # | tbValue tbUnaryOperator
              # | tbUnaryOperator tbValue

tbValue -> tbNumber
         | tbTimePoint
         | tbDuration
         | tbVariable

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

tbJan -> "January"    | "Jan" | "01" | "1"  {% id %}
tbFeb -> "February"   | "Feb" | "02" | "2"  {% id %}
tbMar -> "March"      | "Mar" | "03" | "3"  {% id %}
tbApr -> "April"      | "Apr" | "04" | "4"  {% id %}
tbMay -> "May"        | "May" | "05" | "5"  {% id %}
tbJun -> "June"       | "Jun" | "06" | "6"  {% id %}
tbJul -> "July"       | "Jul" | "07" | "7"  {% id %}
tbAug -> "August"     | "Aug" | "08" | "8"  {% id %}
tbSep -> "September"  | "Sep" | "09" | "9"  {% id %}
tbOct -> "October"    | "Oct" | "10" | "10" {% id %}
tbNov -> "November"   | "Nov" | "11" | "11" {% id %}
tbDec -> "December"   | "Dec" | "12" | "12" {% id %}

tbDateSep -> "-" {% id %}
           | "." {% id %}
           | "/" {% id %}

# Units

tbTimeUnit -> tbHours   {% id %}
            | tbMins    {% id %}
            | tbSecs    {% id %}
            | tbMillis  {% id %}

tbDateUnit -> tbDays    {% id %}
            | tbWeeks   {% id %}
            | tbMonths  {% id %}
            | tbYears   {% id %}

# Numbers

tbNumber -> tbInt      {% (d) => parseInt(d[0], 10) %}
          | tbDecimal  {% (d) => parseFloat(d[0]) %}

tbDecimal -> tbInt "." tbInt  {% (d0, _, d1) => d0 + _ + d1 %}
tbInt -> tbDigit:+  {% (d) => d[0].join('') %}

tbDigit -> [0-9] {% id %}

# Whitespace. Postprocrssor is null-returning function for memory efficiency.
__ -> [\s]:+	{% nuller %}   # Mandatory whitespace.
_ -> [\s]:*   {% nuller %}	# Optional whitespace.
