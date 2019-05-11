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
     | tbValue          {% id %}
#	 | tbTimePoint       {% id %}
#	 | tbDuration        {% id %}

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

# Values
tbValue -> tbNumber			 {% (d) => d[0] %}
         | tbTimePoint       {% id %}
         | tbDuration        {% id %}


# Time Point and Duration
@{%
  function join(array) { return array.join(''); }
  function toInt(strVal) { return parseInt(strVal, 10); }
  function date2Array(date) {
    const _date = date || new Date(); // now
    return [
      _date.getFullYear(),
      _date.getMonth(),
      _date.getDate(),
      _date.getHours(),
      _date.getMinutes(),
      _date.getSeconds(),
      _date.getMilliseconds(),
    ]
  }

  function h2Date(hour) {
    const [year,month,date] = date2Array();
    return new Date(year,month,date,toInt(hour));
  }

  function hm2Date(hour, minute) {
    const [year,month,date] = date2Array();
    return new Date(year,month,date,toInt(hour),toInt(minute));
  }

  function hms2Date(hour, minute, second) {
    const [year,month,date] = date2Array();
    return new Date(year,month,date,toInt(hour),toInt(minute),toInt(second));
  }

  function hmss2Date(hour, minute, second, millisec) {
    const [year,month,date] = date2Array();
    return new Date(year,month,date,toInt(hour),toInt(minute),toInt(second),toInt(millisec));
  }

  function mergeDateAndTime(dateOnlyValue, defaultTimeValue) {
    const timeOnlyTimestamp = defaultTimeValue.getTime() - dateOnlyValue.getTime();
    const mergedTimestamp = dateOnlyValue.getTime() + timeOnlyTimestamp;
    return new Date(mergedTimestamp);
  }
%}

tbTimePoint -> tbDate    {% (d) => new Date(d[0]).getTime() %}
             | tbTime    {% (d) => d[0].getTime() %}
             | tbDate _ tbTime {% (d) => mergeDateAndTime(new Date(d[0]), d[2]) %}
#             #  | tbTime tbDate


tbDuration -> tbNumber _ tbTimeUnit      {% (d) => d[0] * d[2] %}

# ISO 8601

#tbTimePoint8601 -> tbDate8601 "T" tbTime8601 tbOffset8601 {% id %}


# Dates
# TODO: simplify - focus on number and type of digits per field, not whether year, month or day.
#       Let the locale determine how to read the parsed string.
tbDate -> tbYear tbDateSep tbMonth tbDateSep tbDay	{% (d) => d.join('') %}
        | tbMonth tbDateSep tbDay tbDateSep tbYear  {% (d) => d.join('') %}
        | tbDay tbDateSep tbMonth tbDateSep tbYear  {% (d) => d.join('') %}
        | tbDay __ tbMonth __ tbYear  				{% (d) => d.join('') %}
        | tbMonth _ tbDay ",":? _ tbYear  			{% (d) => d.join(' ') %}
        | tbDayOfWeek:? _ tbDay _ tbMonth ",":? _ tbYear  			{% (d) => `${d[2]} ${d[4]} ${d[5]} ${d[7]}` %}
        # | tbYear   {% id %}
        # | tbMonth  {% id %}
        # | tbDay    {% id %}

#tbDate8601 -> tbYear "-" tbMonth "-" tbDay      {% (d) => d.join('') %}

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
tbJan -> ("January"i    | "Jan"i | "01" | "1" ) {% id %}
tbFeb -> ("February"i   | "Feb"i | "02" | "2" ) {% id %}
tbMar -> ("March"i      | "Mar"i | "03" | "3" ) {% id %}
tbApr -> ("April"i      | "Apr"i | "04" | "4" ) {% id %}
tbMay -> ("May"i        | "May"i | "05" | "5" ) {% id %}
tbJun -> ("June"i       | "Jun"i | "06" | "6" ) {% id %}
tbJul -> ("July"i       | "Jul"i | "07" | "7" ) {% id %}
tbAug -> ("August"i     | "Aug"i | "08" | "8" ) {% id %}
tbSep -> ("September"i  | "Sep"i | "09" | "9" ) {% id %}
tbOct -> ("October"i    | "Oct"i | "10" | "10") {% id %}
tbNov -> ("November"i   | "Nov"i | "11" | "11") {% id %}
tbDec -> ("December"i   | "Dec"i | "12" | "12") {% id %}

tbDateSep -> [-/.] {% id %}

# Day of the Week
tbDayOfWeek -> tbSun {% id %}
             | tbMon {% id %}
             | tbTue {% id %}
             | tbWed {% id %}
             | tbThu {% id %}
             | tbFri {% id %}
             | tbSat {% id %}

tbSun -> ("Sunday"i    | "Sun"i)            {% id %}
tbMon -> ("Monday"i    | "Mon"i)            {% id %}
tbTue -> ("Tuesday"i   | "Tue"i | "Tues"i ) {% id %}
tbWed -> ("Wednesday"i | "Wed"i | "Weds"i ) {% id %}
tbThu -> ("Thursday"i  | "Thu"i | "Thurs"i) {% id %}
tbFri -> ("Friday"i    | "Fri"i)            {% id %}
tbSat -> ("Saturday"i  | "Sat"i)            {% id %}

# Time
# All parsed strings resolve to a Javascript Date object.
tbTime -> tbHr24                {% (d) => h2Date(d[0]) %}
        #  | tbHr12 _ tbAMPM:?    {% id %}
         | tbHM24               {% (d) => hm2Date(d[0][0], d[0][1]) %}
        #  | tbHM12 _ tbAMPM:?    {% id %}
         | tbHMS24              {% (d) => hms2Date(d[0][0], d[0][1], d[0][2]) %}
        #  | tbHMS12 _ tbAMPM:?   {% id %}
         | tbHMSs24             {% (d) => hmss2Date(d[0][0], d[0][1], d[0][2], d[0][3]) %}
        #  | tbHMSs12 _ tbAMPM:?  {% id %}
#        | tbTime8601            {% id %}

#tbTime8601 ->  tbSecsFraction:?   {% (d) => d.join('') %}

tbHM24 -> tbHr24 tbTimeSep tbMins 	{% (d) => [d[0], d[2]] %}
# tbHM12 -> tbHr12 tbTimeSep [0-5] tbDigit 	{% (d) => d[0].push(d[2], d[3]) %}
tbHMS24 -> tbHr24 tbTimeSep tbMins tbTimeSep tbSecs {% (d) => [d[0], d[2], d[4]] %}
# tbHMS12 -> tbHM12 tbTimeSep [0-5] tbDigit {% (d) => d[0].push(d[2], d[3]) %}
tbHMSs24 -> tbHr24 tbTimeSep tbMins tbTimeSep tbSecs tbSecsFraction {% (d) => [d[0], d[2], d[4], d[5]] %}
# tbHMSs12 -> tbHMS12 tbSecsFraction {% (d) => d[0].push(d[1]) %}

tbHr24 -> [0-2]:? tbDigit 							{% (d) => join(d) %}
tbHr12 -> [0-1]:? tbDigit 							{% (d) => join(d)  %}
tbMins -> [0-5]:? tbDigit                           {% (d) => join(d) %}
tbSecs -> [0-5]:? tbDigit                           {% (d) => join(d) %}
tbSecsFraction -> "." tbDigit tbDigit tbDigit:?   		  {% (d) => d[1] + d[2] + d[3] %}
tbAMPM -> ("am" | "AM" | "pm" | "PM")  {% id %}


tbTimeSep -> [:] {% id %}

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

tbDecimal -> tbInt "." tbInt  {% (d) => d[0] + d[1] + d[2] %}
tbInt     -> tbDigit:+        {% (d) => d[0].join('') %}
tbDigit   -> [0-9]            {% id %}

# Whitespace. Postprocrssor is null-returning function for memory efficiency.
__ -> [\s]:+	{% () => null %}   # Mandatory whitespace.
_ -> [\s]:*   {% () => null %}	# Optional whitespace.
