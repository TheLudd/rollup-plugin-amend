import { flip } from 'yafu'
import { has, test } from 'ramda'
import { parse, print } from 'recast'
import convertMainExport from './convert-main-export'
import convertDIInstantiation from './convert-di-instantiation'
import resolveConfig from './resolve-config'

const acorn = require('acorn')
const jsx = require('acorn-jsx')

const acornParser = acorn.Parser.extend(jsx({ allowNamespacedObjects: true }))

export default function plugin (opts) {
  const fullPathModules = resolveConfig(opts)
  const fileNameSet = new Set(Object.values(fullPathModules))
  const isAmendFile = (filename) => fileNameSet.has(filename)
  const isAmendModule = flip(has, fullPathModules)
  return {
    resolveId (id) {
      if (id === '__amend__') return id

      if (!isAmendModule(id)) return null

      const fpm = fullPathModules[id]
      return test(/^\//, fpm) ? fpm : null
    },

    load (id) {
      if (id === '__amend__') {
        return Object.entries(fullPathModules).map((entry) => {
          const [ name, path ] = entry
          return `export { default as ${name} } from '${path}'`
        }).join('\n')
      }
      return null
    },

    transform (code, id) {
      if (!isAmendFile(id) && code.indexOf('fromNodeConfig') === -1) {
        return null
      }

      // const { program } = parse(code, { parser: acornParser })

      const { program } = parse(code, {
        parser: {
          parse (codeString) {
            return acornParser.parse(codeString, { sourceType: 'module', ecmaVersion: '2020', locations: true })
          },
        },
      })

      if (isAmendFile(id)) {
        convertMainExport(program)
      } else {
        convertDIInstantiation(fullPathModules, program)
      }
      const {
        code: newCode,
        map,
      } = print(program)
      return { code: newCode, map }
    },
  }
}
