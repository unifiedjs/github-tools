/**
 * @import {Pipeline} from 'trough'
 */

import {trough} from 'trough'
import {configure} from './configure.js'
import {labels} from './labels.js'
import {orgs} from './orgs.js'

/** @type {Pipeline} */
export const collective = trough().use(configure).use(labels).use(orgs)
