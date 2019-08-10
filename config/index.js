'use strict'

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

// Name of the whole collective.
exports.collective = 'unifiedjs'

exports.humans = load('unified-humans')
exports.teams = load('unified-teams')
exports.ghOrgs = load('github-organizations')
exports.ghTeams = load('github-teams')
exports.ghHumans = load('github-humans')
exports.ghLabels = load('github-labels')

function load(name) {
  return yaml.safeLoad(fs.readFileSync(path.join('config', name + '.yml')))
}
