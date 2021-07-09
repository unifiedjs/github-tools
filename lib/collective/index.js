import trough from 'trough'
import {configure} from './configure.js'
import {labels} from './labels.js'
import {orgs} from './orgs.js'

export const collective = trough().use(configure).use(labels).use(orgs)
