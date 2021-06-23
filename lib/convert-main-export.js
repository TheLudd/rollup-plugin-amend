import * as t from '@babel/types'
import { propEq } from 'yafu'
import {
  findLastIndex,
  insertAll,
  map,
  pluck,
} from 'ramda'
import createImport from './create-import'

function convertFactoryFunctionNode (node) {
  if (node.type === 'ReturnStatement') {
    const { argument } = node
    return t.exportDefaultDeclaration(argument)
  }
  return node
}

function extractArgumentNames (functionDeclaration) {
  const { params = [] } = functionDeclaration
  return pluck('name', params)
}

function getFactoryFunctionDeclaration (node) {
  return node.type === 'ExportDefaultDeclaration'
    ? node.declaration
    : node.expression.right
}

function isModuleExports (node) {
  const { type } = node
  if (type === 'ExpressionStatement') {
    const { left } = node.expression
    return left != null && left.object.name === 'module' && left.property.name === 'exports'
  }
  return false
}

function exportsFunction (node) {
  const { right } = node.expression
  return right.type === 'FunctionExpression'
}

function isMainExport (node) {
  const { type, declaration = {} } = node
  const { type: declarationType } = declaration
  if (isModuleExports(node)) {
    return true
  }
  return type === 'ExportDefaultDeclaration' && declarationType === 'FunctionDeclaration'
}

export default function convertMainExport (program) {
  const mainExportIndex = program.body.findIndex(isMainExport)

  if (mainExportIndex !== -1) {
    const originalMainExport = program.body[mainExportIndex]

    if (isModuleExports(originalMainExport) && !exportsFunction(originalMainExport)) {
      const { right } = originalMainExport.expression
      const defaultExport = right.type === 'Literal' ? t.stringLiteral(right.value) : right
      const newExport = t.exportDefaultDeclaration(defaultExport)
      program.body.splice(mainExportIndex, 1, newExport)
    } else {
      const factoryFunctionDeclaration = getFactoryFunctionDeclaration(originalMainExport)
      const dependencyNames = extractArgumentNames(factoryFunctionDeclaration)
      const keepers = program.body.slice(0, mainExportIndex)

      const newImports = map((n) => createImport({ name: n, path: n }), dependencyNames)
      const lastImportIndex = findLastIndex(propEq('type', 'ImportDeclaration'), program.body)
      const initial = insertAll(lastImportIndex + 1, newImports, keepers)

      const factoryContents = map(
        convertFactoryFunctionNode,
        factoryFunctionDeclaration.body.body,
      )
      program.body = [ ...initial, ...factoryContents ]
    }
  }
}
