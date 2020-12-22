import { assert } from 'chai'
import { curry } from 'yafu'
import { parse, print } from 'recast'
import { compose, replace, trim } from 'ramda'

const parser = require('acorn')

const { equal } = assert

const outdent = replace(/^ {4}/mg, '')
const clean = compose(
  replace(/"/g, '\''),
  replace(/;$/mg, ''),
  trim,
)

function parseAndConvert (convert, code) {
  const { program } = parse(code, { parser })
  convert(program)
  return print(program).code
}

function createConvertTest (convert, description, input, expected) {
  it(description, () => {
    const result = parseAndConvert(convert, input)
    equal(clean(result), outdent(trim(expected)))
  })
}

export default curry(createConvertTest)
