'use strict'

const trough = require('trough')
const collaborators = require('./collaborators')

module.exports = trough().use(collaborators)
