const P = require('parsimmon');

const lang = P.createLanguage({
  _: P.optWhitespace,

  expression: (r) => {

  },

  number: () => {
    return P.regex(/\d+/);
  },

  keyword: () => {
    return P.regex(/\w+/);
  }
});
