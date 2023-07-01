import {interpolate} from './interpolate.js'

export function find(ctx, expression) {
  const value = interpolate(ctx, expression)
  let [name, role] = value.split('/')
  const team = ctx.teams.find((x) => x.name === name)
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
    (member) =>
      (role === 'lead' && modify(team.lead === member)) ||
      (role !== 'lead' && modify(expand(role).includes(humans[member])))
  )
}

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

function identity(x) {
  return x
}

function negate(x) {
  return !x
}
