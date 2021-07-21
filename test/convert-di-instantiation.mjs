import convertDIInstantiation from '../lib/convert-di-instantiation.mjs'
import createConvertTest from './create-convert-test.mjs'

describe('convertDIInstantiation', () => {
  const fakeModules = {
    dep1: 'full-path-dependency-1',
    dep2: 'full-path-dependency-2',
  }
  const createTest = createConvertTest((program) => convertDIInstantiation(fakeModules, program))

  createTest(
    'only initialization',
    `import { fromNodeConfig } from 'amend'
    import config from './config'

    const di = fromNodeConfig(config)
    const dep1 = di.get('dep1Name')
    const { m } = dep1
    `,
    `import config from './config'

    import dep1 from 'dep1Name'
    const { m } = dep1
    `,
  )

  createTest(
    'unrelated',
    `
import { fromSomethingElse } from 'amend'
import config from './config'

const di = fromSomethingElse(config)
const dep1 = di.get('dep1Name')
    `,
    `
import { fromSomethingElse } from 'amend'
import config from './config'

const di = fromSomethingElse(config)
const dep1 = di.get('dep1Name')
    `,
  )

  createTest(
    'cjs',
    `
    const { fromNodeConfig } = require('amend')
    const config = require('./config')

    const di = fromNodeConfig(config)
    const dep1 = di.get('dep1Name')
    const { m } = dep1
    `,
    `import dep1 from 'dep1Name'
    const config = require('./config')

    const { m } = dep1
    `,
  )

  createTest(
    'loadAll',
    `
    const { fromNodeConfig } = require('amend')
    const di = fromNodeConfig({
      config,
      baseDir: __amendBaseDir,
      annotations: amendAnnotation,
    })
    di.loadAll()
    `,
    `import 'full-path-dependency-1'
    import 'full-path-dependency-2'`,
  )
})
