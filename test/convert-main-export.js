import convertMainExport from '../lib/convert-main-export'
import createConvertTest from './create-convert-test'

describe('convertMainExport', () => {
  const createTest = createConvertTest(convertMainExport)

  createTest(
    'simple factory',
    `export default function factoryWithReturn () {
      function createdFunction () {
        return 1 + 2
      }

      return createdFunction
    }`,
    `function createdFunction () {
      return 1 + 2
    }

    export default createdFunction`,
  )

  createTest(
    'factory with code before',
    `const a = 1

    export default function factoryWithReturn () {
      function createdFunction () {
        return 1 + a
      }

      return createdFunction
    }`,
    `const a = 1

    function createdFunction () {
      return 1 + a
    }

    export default createdFunction`,
  )

  createTest(
    'factory with inner code',
    `const a = 1

    export default function factoryWithReturn () {
      const b = 2

      function createdFunction () {
        return b + a
      }

      return createdFunction
    }`,
    `const a = 1

    const b = 2

    function createdFunction () {
      return b + a
    }

    export default createdFunction`,
  )

  createTest(
    'factory with direct export',
    `export default function () {
      return function anInnerFunction (foo) {
        return foo + 'bar'
      }
    }`,
    `export default function anInnerFunction (foo) {
      return foo + 'bar'
    }`,
  )

  createTest(
    'factory not returning',
    `export default function () {
      sideEffect1()
      sideEffect2()
    }`,
    `sideEffect1()
    sideEffect2()`,
  )

  createTest(
    'factory with dependency',
    `export default function (foo) {
      return foo + 1
    }`,
    `import foo from 'foo'
    export default foo + 1`,
  )

  createTest(
    'factory with other existing imports',
    `import a from 'a'
    export default function (foo) {
      return foo + 1
    }`,
    `import a from 'a'
    import foo from 'foo'
    export default foo + 1`,
  )

  createTest(
    'factory using cjs',
    `module.exports = function (foo) {
      return foo + 1
    }`,
    `import foo from 'foo'
    export default foo + 1`,
  )

  createTest(
    'cjs exporting string',
    "module.exports = 'A string'",
    "export default 'A string'",
  )

  createTest(
    'non factory using cjs',
    `
    module.exports = {
      foo () {
        return 'foo'
      },
      bar () {
        return 'bar'
      },
    }`,
    `
    export default {
      foo () {
        return 'foo'
      },
      bar () {
        return 'bar'
      },
    }`,
  )
})
