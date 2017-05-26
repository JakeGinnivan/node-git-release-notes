import parse, { Token } from './parse'
import tokensToReleaseNotes from './tokens-to-releasenotes'
import releaseNotesGenerator from './release-notes-generator'

export default (fileContents: string, version: string) => {
    const tokens = parse(fileContents)

    const releaseNotes = tokensToReleaseNotes(tokens)
    if (!releaseNotes) {
        throw 'No release notes to update'
    }

    const newestVersion = releaseNotes.versions[0]
    if (!newestVersion) {
        // We need to add the new version
        releaseNotes.versions.unshift({
            version,
            changeLogs: [],
            summary: 'No changes'
        })
    } else if (newestVersion.version.toLowerCase() === 'vnext') {
        newestVersion.version = version
        if (newestVersion.changeLogs.length === 0) {
            newestVersion.summary = 'No changes'
        }
    }

    return releaseNotesGenerator(releaseNotes)
}