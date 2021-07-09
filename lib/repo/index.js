import {trough} from 'trough'
import {labels} from './labels.js'
import {collaborators} from './collaborators.js'

export const repo = trough().use(labels).use(collaborators)
