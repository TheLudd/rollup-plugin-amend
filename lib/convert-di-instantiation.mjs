import babelTraverse from '@babel/traverse'
import { propEq } from 'yafu'
import { map, findLastIndex } from 'ramda'
import createImport from './create-import.mjs'

const traverse = babelTraverse.default

function removeFromBody (node, body) {
  const index = body.findIndex((item) => item === node)
  if (index !== -1) {
    body.splice(index, 1)
  }
}

export default function convertDIInstantiation (modules, program) {
  const newImports = []
  let hasFromNodeConfig = false
  let diIstanceFound = false
  let fromNodeConfigName
  let diInstanceName

  function lookForLoadAll (path) {
    const { node, parent } = path
    const { callee } = node.expression
    if (
      callee.type === 'MemberExpression'
      && callee.object.name === diInstanceName
      && callee.property.name === 'loadAll'
    ) {
      removeFromBody(node, parent.body)
      Object.values(modules).forEach((value) => {
        newImports.push({ path: value })
      })
    }
  }

  function lookForDIVariables (path, declaration) {
    const { node, parent } = path
    const { callee } = declaration.init
    if (
      callee
      && callee.type === 'MemberExpression'
      && callee.object.name === diInstanceName
      && callee.property.name === 'get'
    ) {
      newImports.push({
        name: declaration.id.name,
        path: declaration.init.arguments[0].value,
      })
      removeFromBody(node, parent.body)
    }
  }

  function lookForDIInstantiation (path, declaration) {
    if (declaration.init.callee.name === fromNodeConfigName) {
      const { node, parent } = path
      diInstanceName = declaration.id.name
      diIstanceFound = true
      removeFromBody(node, parent.body)
    }
  }

  function lookFoFromNodeConfigByRequire (path, declaration) {
    if (declaration.id.type !== 'ObjectPattern') return
    if (declaration.init.type !== 'CallExpression') return

    const {
      id,
      init: { callee, arguments: args },
    } = declaration
    if (
      callee.name === 'require'
      && args.length > 0
      && args[0].value === 'amend'
    ) {
      id.properties.forEach((p) => {
        if (p.key.name === 'fromNodeConfig') {
          const { node, parent } = path
          hasFromNodeConfig = true
          fromNodeConfigName = p.value.name
          removeFromBody(node, parent.body)
        }
      })
    }
  }

  function lookForNodeConfigByImport (path) {
    const { node, parent } = path
    const { source, specifiers } = node
    if (source.value === 'amend') {
      const fromNodeConfigSpecifier = specifiers.find((item) => {
        const { imported } = item
        return imported.name === 'fromNodeConfig'
      })
      if (fromNodeConfigSpecifier != null) {
        hasFromNodeConfig = true
        const { name } = fromNodeConfigSpecifier.local
        fromNodeConfigName = name
      }
      if (fromNodeConfigSpecifier != null && specifiers.length === 1) {
        removeFromBody(node, parent.body)
      }
    }
  }

  traverse(program, {
    ImportDeclaration (path) {
      lookForNodeConfigByImport(path)
    },
    VariableDeclaration (path) {
      const { node } = path
      const { declarations = [] } = node

      if (declarations.length !== 1) return
      const dec = path.node.declarations[0]

      if (!hasFromNodeConfig) {
        lookFoFromNodeConfigByRequire(path, dec)
      } else if (diIstanceFound) {
        lookForDIVariables(path, dec)
      } else {
        lookForDIInstantiation(path, dec)
      }
    },
    ExpressionStatement (path) {
      if (hasFromNodeConfig && diIstanceFound) {
        lookForLoadAll(path)
      }
    }
  })
  const imports = map(createImport, newImports)
  const lastImportIndex = findLastIndex(propEq('type', 'ImportDeclaration'), program.body)
  program.body.splice(lastImportIndex + 1, 0, ...imports)
}
