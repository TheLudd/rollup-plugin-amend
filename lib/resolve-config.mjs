/* eslint-disable global-require, import/no-dynamic-require */
import { join } from 'path'
import {
  is,
  map,
  mergeAll,
  test,
} from 'ramda'

function getRequirePath (v) {
  return is(String, v) ? v : v.require
}

function resolveModulesObject (baseDir, m) {
  return map((v) => {
    const path = getRequirePath(v)
    const isLocal = test(/^\./, path)
    return isLocal
      ? require.resolve(path, { paths: [ baseDir ] })
      : path
  }, m)
}

export default function resolveConfig ({ baseDir, config }) {
  const { modules = {}, parents = [] } = config

  function findPath (path) {
    return require.resolve(path, { paths: [ baseDir ] })
  }

  const resolvedParents = map((p) => {
    const { configFile, nodeModule } = p

    const parentPath = findPath(join(nodeModule, configFile))
    const parentBaseDir = findPath(join(nodeModule, 'package.json')).replace('/package.json', '')
    const parentConfig = require(parentPath)
    return resolveConfig({ baseDir: parentBaseDir, config: parentConfig })
  }, parents)

  const resolvedModules = resolveModulesObject(baseDir, modules)
  return mergeAll([ ...resolvedParents, resolvedModules ])
}
