import { readFileSync } from 'fs'
import { join } from 'path'
import { flip } from 'yafu'
import { has, map } from 'ramda'
import { parse, print } from 'recast'
import convertMainExport from './convert-main-export'
import convertDIInstantiation from './convert-di-instantiation'

const parser = require('acorn')

export default function plugin (opts) {
  const { baseDir, config: { modules = {} } } = opts

  const fullPathModules = map((v) => join(baseDir, v), modules)
  const isAmendModule = flip(has, fullPathModules)

  return {
    resolveId (id) {
      return isAmendModule(id) ? id : null
    },

    load (id) {
      return isAmendModule(id) ? readFileSync(fullPathModules[id], 'utf-8') : null
    },

    transform (code, id) {
      if (!isAmendModule(id) && code.indexOf('fromNodeConfig') === -1) {
        return null
      }

      const { program } = parse(code, { parser, sourceFileName: 'source.js' })
      if (isAmendModule(id)) {
        convertMainExport(program)
      } else {
        convertDIInstantiation(program)
      }
      return print(program, { sourceMapName: 'map.json' })
    },
  }
}
