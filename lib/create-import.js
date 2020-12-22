import * as t from '@babel/types'

export default function createImport ({ name, path }) {
  return t.importDeclaration([
    t.importDefaultSpecifier(t.identifier(name)),
  ], t.stringLiteral(path))
}
