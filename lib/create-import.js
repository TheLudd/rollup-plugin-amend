import * as t from '@babel/types'
import { map } from 'ramda'

function createDefaultSpecifier (name) {
  return t.importDefaultSpecifier(t.identifier(name))
}

export default function createImport ({ name, path }) {
  const names = name == null ? [] : [ name ]
  return t.importDeclaration(map(createDefaultSpecifier, names), t.stringLiteral(path))
}
