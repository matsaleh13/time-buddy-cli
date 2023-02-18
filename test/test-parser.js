const { expect } = require('chai');
const parse = require('../lib/solvent-parse');
// const ast = require('../lib/solvent-ast');

describe('solvent-parse', () => {

  it('parses addition expression', () => {
    const exp = '2 + 2';
    console.log(exp);
    const result = parse(exp);
    console.log(result);

    expect(result).not.equal(null);
  });

});
