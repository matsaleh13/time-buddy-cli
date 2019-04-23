tbOperation -> tbCommand tbExpression
	         | tbExpression

tbCommand -> "calc"  {% id %}
		   | "list"  {% id %}
		   | "count" {% id %}
		   | "set"   {% id %}

tbExpression -> tbValue tbBinaryOperator tbValue
		      | tbValue tbUnaryOperator
			  | tbUnaryOperator tbValue

tbValue -> tbNumber
         | tbTimePoint
		 | tbDuration
		 | tbVariable

tbNumber -> tbInt
		  | tbDecimal

tbTimePoint -> tbDate
             | tbTime
			 | tbDate tbTime
			 | tbTime tbDate

tbDuration -> tbNumber tbTimeUnit:?

tbDecimal -> tbInt "." tbInt

tbDate -> tbYear tbSep:? tbMonth tbSep:? tbDay
        | tbMonth tbSep:? tbDay tbSep:? tbYear
		| tbDay tbSep:? tbMonth tbSep:? tbYear
		| tbYear
		| tbMonth
		| tbDay

tbYear -> tbDigit tbDigit tbDigit tbDigit
        | tbDigit tbDigit

tbMonth -> tbJan | tbFeb | tbMar | tbApr | tbMay | tbJun | tbJul | tbAug | tbSept | tbOct | tbNov | tbDec
          |

tbInt -> tbDigit:+

tbDigit -> [0-9]

# Whitespace. Postprocrssor is null-returning function for memory efficiency.
__ -> [\s]:+	{% function(d) {return null; } %}   # Mandatory whitespace.
_ -> [\s]:*     {% function(d) {return null; } %}	# Optional whitespace.
