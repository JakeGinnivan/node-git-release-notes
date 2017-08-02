import { fromMarkdown, ReadOptions } from '../release-notes/read'
import { ReleaseNotes } from '../release-notes/model'
import { getReleaseDate } from '../utils/date'

export const updateRelease = (releaseNotes: ReleaseNotes, version: string) => {
    const newestVersion = releaseNotes.versions[0]
    if (!newestVersion) {
        // We need to add the new version
        releaseNotes.versions.unshift({
            version,
            changeLogs: [],
            summary: 'No changes',
        })
        return
    }
    if (newestVersion.version.toLowerCase() === 'vnext') {
        const date = new Date()
        newestVersion.releaseDate = getReleaseDate()
        newestVersion.version = version
        if (newestVersion.changeLogs.length === 0) {
            newestVersion.summary = 'No changes'
            return
        }
        return newestVersion
    }

    return
}
