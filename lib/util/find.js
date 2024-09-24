/**
 * @import {Context, Role} from './types.js'
 */

import assert from 'node:assert/strict'
import {interpolate} from './interpolate.js'

/**
 * @param {Context} context
 *   Context.
 * @param {string} expression
 *   Expression to interpolate.
 * @returns {Array<string>}
 *   Names of humans.
 */
export function find(context, expression) {
  const value = interpolate(context, expression)
  let [name, role] = value.split('/')
  const team = context.teams.find(function (x) {
    return x.name === name
  })
  /** @type {(x: unknown) => unknown} */
  let modify = identity

  if (!team) {
    throw new Error('Could not find team `' + name + '`')
  }

  if (role.charAt(0) === '!') {
    modify = negate
    role = role.slice(1)
  }

  assert(
    role === 'contributor' ||
      role === 'lead' ||
      role === 'maintainer' ||
      role === 'member' ||
      role === 'merger' ||
      role === 'releaser'
  )

  const expanded = role === 'lead' ? undefined : expand(role)

  const {humans} = team

  return Object.keys(humans).filter(function (member) {
    return (
      (expanded === undefined && modify(team.lead === member)) ||
      (expanded !== undefined && modify(expanded.includes(humans[member])))
    )
  })
}

/**
 *
 * @param {Role} role
 * @returns {Array<Role>}
 */
function expand(role) {
  switch (role) {
    case 'contributor': {
      return [role, 'member']
    }

    case 'merger': {
      return [role, 'maintainer', 'member']
    }

    case 'releaser': {
      return [role, 'maintainer', 'member']
    }

    case 'maintainer': {
      return ['merger', 'releaser', role, 'member']
    }

    case 'member': {
      return ['contributor', 'merger', 'releaser', 'maintainer', role]
    }

    default: {
      throw new Error('Unknown role `' + role + '`')
    }
  }
}

/**
 * @template Value
 * @param {Value} x
 * @returns {Value}
 */
function identity(x) {
  return x
}

/**
 * @param {unknown} x
 * @returns {boolean}
 */
function negate(x) {
  return !x
}
