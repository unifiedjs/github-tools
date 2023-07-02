import {trough} from 'trough'
import {collaborators} from './collaborators.js'
import {labels} from './labels.js'

export const repo = trough().use(labels).use(collaborators)
