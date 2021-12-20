import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'

const base = 'https://raw.githubusercontent.com/unifiedjs/collective/HEAD/data/'
const files = ['humans.yml', 'teams.yml']

files.forEach((filename) => {
  https.get(base + filename, (response) => {
    response.pipe(
      fs.createWriteStream(path.join('config', 'unified-' + filename))
    )
  })
})
