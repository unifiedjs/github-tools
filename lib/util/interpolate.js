'use strict'

const dlv = require('dlv')

module.exports = interpolate

function interpolate(ctx, value) {
  return value.replace(/:([\w$.]+)/g, replace)
  function replace($0, $1) {
    return dlv(ctx, $1)
  }
}
