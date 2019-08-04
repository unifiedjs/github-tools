const trough = require('trough')
const people = require('./people')
const teams = require('./teams')
const repos = require('./repos')

module.exports = trough()
  .use(people)
  .use(teams)
  .use(repos)
