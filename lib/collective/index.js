'use strict'

const trough = require('trough')
const configure = require('./configure')
const labels = require('./labels')
const orgs = require('./orgs')

module.exports = trough()
  .use(configure)
  .use(labels)
  .use(orgs)
