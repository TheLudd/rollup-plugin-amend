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

function isMainExport (node) {
  const { type, declaration = {} } = node
  const { type: declarationType } = declaration
  if (type === 'ExpressionStatement') {
    const { left } = node.expression
    if (left.object.name === 'module' && left.property.name === 'exports') {
      const { right } = node.expression
      return right.type === 'FunctionExpression'
    }
  }
  return type === 'ExportDefaultDeclaration' && declarationType === 'FunctionDeclaration'
}

export default function convertMainExport (program) {
  const mainExportIndex = program.body.findIndex(isMainExport)

  const originalMainExport = program.body[mainExportIndex]
  if (mainExportIndex !== -1) {
    const lastImportIndex = findLastIndex(propEq('type', 'ImportDeclaration'), program.body)
    const factoryFunctionDeclaration = getFactoryFunctionDeclaration(originalMainExport)
    const dependencyNames = extractArgumentNames(factoryFunctionDeclaration)
    const newImports = map((n) => createImport({ name: n, path: n }), dependencyNames)
    const keepers = program.body.slice(0, mainExportIndex)
    const initial = insertAll(lastImportIndex + 1, newImports, keepers)
    const factoryContents = map(
      convertFactoryFunctionNode,
      factoryFunctionDeclaration.body.body,
    )
    program.body = [ ...initial, ...factoryContents ]
  }
}
