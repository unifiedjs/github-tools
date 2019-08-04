'use strict'

const interpolate = require('./interpolate')

module.exports = find

function find(ctx, expression) {
  const value = interpolate(ctx, expression)
  let [name, role] = value.split('/')
  const team = ctx.teams.find(x => x.name === name)
  let modify = identity

  if (!team) {
    throw new Error('Could not find team `' + name + '`')
  }

  if (role.charAt(0) === '!') {
    modify = negate
    role = role.slice(1)
  }

  const {humans} = team

  return Object.keys(humans).filter(
    member =>
      role === '*' ||
      modify(humans[member] === role) ||
      (role === 'lead' && team.lead === member)
  )
}

function identity(x) {
  return x
}

function negate(x) {
  return !x
}
