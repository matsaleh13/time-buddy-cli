# time-buddy-cli dev log

## 2019-01-20

- Initial commit.
- Project setup.
- Prelim docs.

## 2019-01-27

- Experimenting with Typescript:
  - Installed globally:

    ```bash
    λ npm install -g typescript
    C:\Program Files\nodejs\tsc -> C:\Program Files\nodejs\node_modules\typescript\bin\tsc
    C:\Program Files\nodejs\tsserver -> C:\Program Files\nodejs\node_modules\typescript\bin\tsserver
    + typescript@3.2.4
    added 1 package from 1 contributor in 5.321s
    ```

  - Init for project:

    ```bash
    λ tsc --init
    message TS6071: Successfully created a tsconfig.json file.
    ```

  - I may bail on this though:
    - Maybe don't add a new thing to learn among the others here.
    - [The TypeScript Tax](https://medium.com/javascript-scene/the-typescript-tax-132ff4cb175b)
- Experimenting with [Parsimmon](https://github.com/jneen/parsimmon):
  - Added to project.

## 2019-04-19

- Exploring [`nearly.js`](https://nearley.js.org/docs/).
  - Candidate parser tool set.
  - Parses *anything*.
  - EBNF grammar.
  - Uses Early algorithm. More flexible/stable than recursive descent.

## 2019-04-20

- Continuing research into parsing options. 
  - Still on `nearly.js`.
  - Now looking for other options as well: [Parsing in JavaScript: Tools and Libraries](https://tomassetti.me/parsing-in-javascript/).

## 2019-04-21

- More parsing reseach:
  - Tried playing with the [Nearley Parser Playground](https://omrelli.ug/nearley-playground/):
    - Experimented with the calculator/arithmetic.ne grammar, which kind of made sense.
    - Experimented with the edtf.ne grammar from the edtf.js project, but it didn't seem to recognize anything I typed in.
  - Cloned the edtf.js repo, installed nearly into it, and played with nearly-test. 
    - With edtf.ne, got some results I could kind of understand:

      ```shell
      pearl:edtf.js matsaleh$ node_modules/.bin/nearley-test -i 2015-08-14T00:00:00 src/edtf_grammar.js

      <skip parse charts>

      Parse results:
      [ { values: [ 2015, 7, 14, 0, 0, 0 ],
          offset: 300,
          type: 'Date',
          level: 0 } ]
      ```

- Also researching date/time libraries to use:
  - [9 Javascript Time and Date Manipulation Libraries for 2019](https://blog.bitsrc.io/9-javascript-date-time-libraries-for-2018-12d82f37872d)

## 2019-04-22

- Started hacking together my own grammar using the [Nearley Playground](https://omrelli.ug/nearley-playground/).

## 2019-04-25

- More hacking on tb-grammar.ne.
- Trying to get some meaningful output. 
  - The playground doesn't give any feedback.
  - The nearley-unparse does nothing.
  - The nearley-test returns nothing also.

## 2019-04-26

- Iterating on the grammar:
  - Commented out much of the extra stuff, and focused on getting PEMDAS to work.
  - Again, iterated using the playground site.
  - Got it working to the point where basic arithmetic and parens are working, w00t:

    ```text
    (1 + 3) * 3
    => 12
    ```

  - Tried adding in some date stuff, like year.
    - Currently defined in terms of `tbDigit`, which is an ancestor of `tbNumber`.
    - That made it hard to distinguish between a year and a division operation:

      ```text
      1984/05/21
      => 18.895238095238096 # not what I want.
      ```

## 2019-04-27

- WIP on the grammar:
  - Found that my inability to distinguish between date separator and division operator was due in part to simply omitting the `tbTimePoint` production:

    ```text
    tbNumber -> tbInt       {% (d) => parseInt(d[0], 10) %}
              | tbDecimal   {% (d) => parseFloat(d[0]) %}
              | tbTimePoint {% id %}  # this was missing
    ```

  - This gave me:

    ```text
    1984/03/14
    =>
    "1984-03-14T06:00:00.000Z"
    47.23809523809524
    ```

  - Note the multiple results! That's because this is an ambiguous grammar, which means that we can't tell which way to interpret the date string. 
    - In this case, ambiguity is probably okay, because it's tightly bounded (i.e. no recursion or optional/variable lengths).
    - Plus, one of the benefits of `nearley.js` is that it gives all possible results of an ambiguous grammar in a deterministic order.
    - That means we can probably write code to pick the one we want based on the context. For example, if we get an ambiguous result that has a `Date` as its first value, that's probably always what we want.

  - Alternately, I also got it to work by enclosing the date string in quotes, but I'd really like to avoid requiring that of the user if possible.  
  - Also, I'm finding the ability to interactively experiment in the playground page to be essential to both learning and building the grammar.

  - Now building up the units.
    - Time units are used for durations, e.g. hours, minutes, etc.
    - All expressed in terms of milliseconds, since that's the precision of the native Javascript epoch time.
    - Some things will be a problem, e.g. millis per year (leap years), or per month (e.g. different lengths). TBD on some of that.
    - Wrote some JS code declaring a set of constants for the units:

      ```javascript
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
      ```

    - Followed by the grammar for each unit, with a postprocessor for each unit that returns the corresponding constant:

    ```bnf
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
    ```

    - This works pretty well:

    ```text
    1h
    => 3600000 # millis

    3 days
    => 259200000 # millisß
    ```

  - Still got issues parsing dates, lah!
    - `2019/05/14` parses to a date (and other things).
    - `05/14/2019` parses to a division expression (still/again).
  - Worked around them for now by requiring spaces around arithmetic operators. 
    - Not sure I like that much, but it's a tradeoff between that and quotes around date strings, which I also don't like.
    - TODO: revisit this once other issues worked out.

## 2019-04-28

- WIP on grammar still:
  - Now iterating on the `TimePoint` concepts. This is the hardest yet, though:
    - Can't just parse the string, as I could with a date.
    - Really need an array of values, matching the arguments of the JS `Date` class.
    - For cases where I have only the time components, I'll need to infer "today" for the date. Conceptually not hard, but fitting this into the postprocessor code blocks will start looking messy.
    - I think I'll need some utility functions, e.g.:

    ```Javascript
    hToDate(hour: string) => Date
    hmToDate(hour: string, minute: string) => Date
    hmsToDate(hour: string, minute: string, second: string) => Date
    hmssToDate(hour: string, minute: string, second: string, milli: string) => Date
    ```
