import {trough} from 'trough'
import {request} from './request.js'
import {create} from './create.js'
import {update} from './update.js'
import {members} from './members.js'
import {repo} from './repo.js'

export const team = trough()
  .use(request)
  .use(create)
  .use(update)
  .use(members)
  .use(repo)
