import {trough} from 'trough'
import {people} from './people.js'
import {repos} from './repos.js'
import {teams} from './teams.js'

export const org = trough().use(people).use(repos).use(teams)
