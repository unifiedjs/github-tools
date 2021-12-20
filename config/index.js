import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

// Name of the whole collective.
export const collective = 'unifiedjs'

export const humans = load('unified-humans')
export const teams = load('unified-teams')
export const ghOrgs = load('github-organizations')
export const ghTeams = load('github-teams')
export const ghHumans = load('github-humans')
export const ghLabels = load('github-labels')
export const ghLabelsNext = load('github-labels-next')

function load(name) {
  return yaml.load(fs.readFileSync(path.join('config', name + '.yml')))
}
