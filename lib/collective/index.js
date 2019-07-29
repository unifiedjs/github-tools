'use strict'

const trough = require('trough')
const orgs = require('./orgs')

module.exports = trough().use(orgs)
