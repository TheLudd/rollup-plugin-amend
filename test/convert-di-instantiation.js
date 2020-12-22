import convertDIInstantiation from '../lib/convert-di-instantiation'
import createConvertTest from './create-convert-test'

describe('convertDIInstantiation', () => {
  const createTest = createConvertTest(convertDIInstantiation)

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
})
