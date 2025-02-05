import textStemmer from '@worldbrain/memex-stemmer'
import { Stemmer } from '@worldbrain/storex-backend-dexie'

import { transformUrl } from '../pipeline'

const stemmer: Stemmer = (url) => {
    let { pathname } = transformUrl(url)
    if (pathname == null) {
        return new Set()
    }

    pathname = pathname.replace(/-/g, ' ')
    return textStemmer(pathname)
}

export default stemmer
