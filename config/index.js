import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

// Name of the whole collective.
export var collective = 'unifiedjs'

export var humans = load('unified-humans')
export var teams = load('unified-teams')
export var ghOrgs = load('github-organizations')
export var ghTeams = load('github-teams')
export var ghHumans = load('github-humans')
export var ghLabels = load('github-labels')

function load(name) {
  return yaml.load(fs.readFileSync(path.join('config', name + '.yml')))
}
