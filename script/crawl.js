import {createWriteStream} from 'node:fs'
import https from 'node:https'

const base = 'https://raw.githubusercontent.com/unifiedjs/collective/HEAD/data/'
const files = ['humans.yml', 'teams.yml']

for (const filename of files) {
  const url = new URL('../config/unified-' + filename, import.meta.url)

  https.get(
    base + filename,
    /**
     * @returns {undefined}
     */
    function (response) {
      response.pipe(createWriteStream(url))
    }
  )
}
