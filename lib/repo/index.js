/**
 * @import {Pipeline} from 'trough'
 */

import {trough} from 'trough'
import {collaborators} from './collaborators.js'
import {labels} from './labels.js'

/** @type {Pipeline} */
export const repo = trough().use(labels).use(collaborators)
