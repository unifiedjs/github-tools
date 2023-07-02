import fs from 'node:fs'
import yaml from 'js-yaml'

// Name of the whole collective.
export const collective = 'unifiedjs'

export const humans = load('unified-humans')
export const teams = load('unified-teams')
export const ghOrgs = load('github-organizations')
export const ghTeams = load('github-teams')
export const ghHumans = load('github-humans')
export const ghLabels = load('github-labels')

/**
 *
 * @param {string} name
 * @returns {unknown}
 */
function load(name) {
  const url = new URL(name + '.yml', import.meta.url)
  const doc = String(fs.readFileSync(url))
  return yaml.load(doc)
}
