import * as fs from 'fs-extra'
import glob from '../utils/glob'
import { fromMarkdown } from '../release-notes/read'
import { formatVersionChanges, defaultFormattingInfo } from '../release-notes/write'

export const view = async (fileGlob: string, versionSpec: string) => {
    const files = await glob(fileGlob, {
        nocase: true,
        ignore: 'node_modules/**',
    })

    if (files.length !== 1) {
        // tslint:disable-next-line:no-string-throw
        throw `Expected to find one file matching ${fileGlob}`
    }

    const changelogContents = (await fs.readFile(files[0])).toString()

    return extractChanges(files[0], changelogContents, versionSpec)
}

export const extractChanges = (filename: string, changelog: string, versionSpec: string) => {
    const releaseNotes = fromMarkdown(changelog, filename)

    const parts = versionSpec.split('...')
    if (parts.length === 1) {
        const version = releaseNotes.versions.find(v => v.version.includes(parts[0]))
        if (!version) {
            // tslint:disable-next-line:no-string-throw
            throw `Cannot find version information for ${parts[0]}`
        }

        return formatVersionChanges(
            version.summary,
            version.changeLogs,
            releaseNotes.formattingData || defaultFormattingInfo,
        )
    }
}
