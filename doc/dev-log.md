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
