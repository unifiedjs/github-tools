'use strict'

const trough = require('trough')
const labels = require('./labels')
const collaborators = require('./collaborators')

module.exports = trough().use(labels).use(collaborators)
