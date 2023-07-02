import {trough} from 'trough'
import {create} from './create.js'
import {members} from './members.js'
import {repo} from './repo.js'
import {request} from './request.js'
import {update} from './update.js'

export const team = trough()
  .use(request)
  .use(create)
  .use(update)
  .use(members)
  .use(repo)
