import parse, { Token } from './parse'
import tokensToReleaseNotes from './tokens-to-releasenotes'
import releaseNotesGenerator from './release-notes-generator'
import { Options } from './options'

export default (fileContents: string, version: string, filename: string, options?: Options) => {
    const tokens = parse(fileContents)

    const releaseNotes = tokensToReleaseNotes(tokens, filename, options || { debug: true })
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
        const date = new Date()
        newestVersion.version = `[${version}] - ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
        if (newestVersion.changeLogs.length === 0) {
            newestVersion.summary = 'No changes'
        }
    }

    return releaseNotesGenerator(releaseNotes)
}