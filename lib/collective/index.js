'use strict'

const trough = require('trough')
const configure = require('./configure')
const orgs = require('./orgs')

module.exports = trough()
  .use(configure)
  .use(orgs)
