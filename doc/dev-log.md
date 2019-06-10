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

- More parsing research:
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

    - The utility functions are helping.
    - Still finding it a challenge to find the right place to do an 'expansion' of a pattern into components. It seems that the more I 'modularize' the grammar (i.e. assemble higher level nonterminals from lower-level components), the more likely I am to get an ambiguous grammar. It's almost as though I should make a bunch of highly specific productions, potentially with duplicated nonterminals and terminals, in order to get more precise/less ambiguous results.
    - Still feeling my way I guess. This is very much an organic process I think.

- As I work my way through the grammar, I keep wondering if I should also create an abstract syntax tree (AST), as I've seen done in some other sample grammars using `nearley.js`. 
  - On one hand, it seems like a nice way to separate concerns between parsing the grammar and interpreting the results.
  - But, in my case I will only ever have a single expression to parse. Other than parens, there isn't really any concept of scope, and certainly no control flow, so it's really simple and may not need an AST. TBD I guess.

## 2019-05-11

- WIP on grammar:
  - Figured out that all `tbTime` nonterminals need to be converted to an epoch timestamp, not just a Date() object.
- Read up on JavaScript date/time concepts:
  - Notes: [Date/Time Notes](date-time-notes.md)
- More parsing issues for dates and times:
  - I shouldn't rely on JS `Date(<string>)` or `Date.parse(<string>)`, according to all good authorities.
  - If I convert to a Date() too early, then I having trouble resolving the full tbTimePoint in the case where I have both a `tbDate` and `tbTime`, e.g.

  ```ebnf
  tbTimePoint -> tbDate          {% xxx %}
               | tbTime          {% xxx %}
               | tbDate _ tbTime {% xxx %}  # <= this case
  ```

  - What happens in the above case, is that both `tbDate` and `tbTime` are a complete Date instance. `tbDate` holds only the date part, with the time part zeroed out (e.g. midnight). However, `tbTime` assumes the date part is 'today', as given a time with no date, we assume that normally. Yet, to combine the `tbDate` and `tbTime` values together, I somehow need to strip out the date part from `tbTime`, then add the result to `tbDate` to get the correct value.
  - Well, that did it:
  
  ```javascript
    function mergeDateAndTime(dateOnlyValue, defaultTimeValue) {
      const timeOnlyTimestamp = defaultTimeValue.getTime() - dateOnlyValue.getTime();
      const mergedTimestamp = dateOnlyValue.getTime() + timeOnlyTimestamp;
      return new Date(mergedTimestamp);
    }

    # nearley grammar
    tbTimePoint -> tbDate    {% (d) => new Date(d[0]).getTime() %}
                | tbTime    {% (d) => d[0].getTime() %}
                | tbDate _ tbTime {% (d) => mergeDateAndTime(new Date(d[0]), d[2]) %}

    # nearley test
    11 May 2019 21:17:44  # note assumes local (CDT)
    => "2019-05-12T02:17:44.000Z"
  ```

## 2019-05-25

- Thinking that the grammar is too tightly coupled to the computation the app needs to do.
- Also it's really ambiguous, and that could bite me in the ass, I'm sure.
- My gut is telling me that an AST (abstract syntax tree) would help here:

  - Separation of concerns
  - Possibly allow more context-free-ness

- Examples of nearley.js with an AST (or just AST):

  - [andrejewski/solvent](https://github.com/andrejewski/solvent) - calculator with equations and variables. 
    - Fairly simple.
    - Not well documented.
    - Code indicates a two-step `parse(statement)` then `compute(exp)` approach. The `parse` takes a string containing the arithmetic statement and returns an AST. The `compute(exp)` operates on the AST and returns the result. This does make sense, if I could just see how to apply the AST concept to the `time-buddy` problem.
  - [Mithgol/node-abstract-syntax-tree](https://github.com/Mithgol/node-abstract-syntax-tree) - An AST NPM package for node.js.
    - TODO: evaluate this, or learn from it.
    - Last commit was 2 years ago.
  - [ASTQuery](https://prataprc.github.io/astquery.io/) - A golang AST implementation:
    - TODO: learn from this.
  - [AST for JavaScript developers](https://itnext.io/ast-for-javascript-developers-3e79aeb08343) - overview of the JavaScript AST.
  - [AST Explorer](https://astexplorer.net/) - Playground website for experimenting with ASTs.
  - [Introduction to Abstract Syntax Trees](https://egghead.io/lessons/javascript-introduction-to-abstract-syntax-trees) - Video overview of the JavaScript AST.
  - [Abstract syntax trees on Javascript](https://medium.com/@jotadeveloper/abstract-syntax-trees-on-javascript-534e33361fc7) - Reviews ASTs for JS compilers and analysis tools.
  - [Abstract Syntax Trees](https://javascriptstore.com/2017/10/02/abstract-syntax-trees/) - ASTs for JavaScript code.

## 2019-05-26

- More AST research/learning:
  - Mostly (re-)reading above links.
  - Also found a few more:
    - [Wikipedia](https://en.wikipedia.org/wiki/Abstract_syntax_tree)
    - [Building a compiler for your own language: from the parse tree to the Abstract Syntax Tree](https://tomassetti.me/parse-tree-abstract-syntax-tree/) - Describes design of AST for a made up language.

- Started rough design of AST.

## 2019-05-27

- Iterating on AST design and integration with grammar.
- Still trying to get my mind around the paradigm.
- Trying to map the existing inline functions (operations) to AST nodes that will perform them:
  - Forked the tb-grammar.ne to tb-grammer-ast.ne.
  - Just for now, to iterate on the changes.
  - Concerned that I won't be able to use the playground to get instant feedback on the changes.

## 2019-06-08

- More AST research and design iteration.
- Looking at the use of the ast in `solvent.js`:
  - Very simple tree implementation.
  - One node type for each nonterminal to process (roughly).
  - Each node type implemented as a function that:
    - takes as input an array of Nearley.js "elements" from parsing, plus some misc attributes.
    - returns an object that is a node of the AST.
  - This such that as we walk through the grammar, each post-processor returns either:
    - native JS data, either array or scalar.
    - an AST node.
  - The `solvent.js` `parse` function invokes the `nearley.Parser` object and then calls `feed` on it. 
    - This returns a tree of Nearley elements. 
    - Then calls `clean` on the returned output, which walks the tree and then hooks up the nodes of the AST. 
    - I think. It's pretty terse and not commented at all.
  - The main process is:
    - parse -> takes string input, returns populated AST.
    - compute -> takes AST, returns calculation result.
  - The AST node object is:

    ```Javascript
    {
      type: String,
      nodes: Array,
      attrs: Array,
    }
    ```

    - The `nodes` array contains other node objects or scalar (terminal) values.
  - The `compute` function recursively walks the AST:
    - If it finds a number, returns it.
    - If it finds a function, calls it via `map` and `reduce` over its child nodes.
    - Otherwise, error.
- Taking some general clues from this:
  - The time-buddy parser should (only) interpret:
    - values
    - types
    - operations to perform
    - expression/relational structure
  - A separate 'compute' step should:
    - walk the AST nodes.
    - compute the values of each node.
    - return the overall result.
- How to handle polymorphic operations?
  - e.g. arithmetic on numbers vs. time points, or mixed?
  - Option A: let the parser interpret the types and values, and call a single polymorphic function that "does the right thing" based on the types.
  - Option B: have the parser pick a specific function for each combination of types (e.g. number and number, time point and number, etc.).
  - Option A means the parser has fewer unique productions but is potentially more ambiguous. The compute code will be more complex though and much dispatch on types.
  - Option B means that the parser is more specific, with more productions, but probably less ambiguous. The compute code will be simpler, with each nonterminal dispatching to a specific function.
- I guess I'm leaning towards Option A for now:
  - It's harder to debug the parser than it is the code.
  - The current parser implementation already does it this way, so I can try this first.
  - TBH, it's hard to tell which is best.
- Since I'm still learning/experimenting, I'm tempted to just "steal" the `solvent.js` AST outright and "plug" it into the time-buddy code as a first pass. This might help me learn it better. I still want to implement my own though.

## 2019-06-09

- Hacked in the `solvent.js` AST implementation into my grammar, mostly unchanged:
  - Added no new AST types, just the basic arithmetic ones that `solvent.js` implemented.
  - Hooked in calls to `ast.XXX` where reasonable for non-TimePoint values.
- Wrote a simple mocha test for parsing "2 + 2":
  - Test calls the `solvent.js` `parse` function.
  - Parsing seems to work, mostly.
  - Except that the ambiguous grammar returned 4 top-level nonterminals, i.e. 4 possible results of parsing "2 + 2".
  - The `solvent.js` `parse` function treats this as an error and returns null. I mean, how can it know which one to pick?
  - Re-reading [Better Earley than Never](https://hardmath123.github.io/earley.html), I noted:
    > If we had multiple entries that worked in the end, there would be multiple parsings of the grammar. This means the grammar is ambiguous, and this is generally a very bad sign. It can lead to messy programming bugs, or exponentially slow parsing.
  - Well, that's what I have. So, how to disambiguate it?
