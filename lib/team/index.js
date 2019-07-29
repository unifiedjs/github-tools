'use strict'

const trough = require('trough')
const request = require('./request')
const create = require('./create')
const update = require('./update')
const members = require('./members')
const repo = require('./repo')

module.exports = trough()
  .use(request)
  .use(create)
  .use(update)
  .use(members)
  .use(repo)
