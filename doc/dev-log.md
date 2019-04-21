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

- More parsing reseach.
