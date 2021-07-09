import trough from 'trough'
import {people} from './people.js'
import {teams} from './teams.js'
import {repos} from './repos.js'

export const org = trough().use(people).use(repos).use(teams)
