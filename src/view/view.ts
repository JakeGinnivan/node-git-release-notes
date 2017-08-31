import * as fs from 'fs-extra'
import glob from '../utils/glob'
import { fromMarkdown } from '../release-notes/read'
import { formatVersionChanges, defaultFormattingInfo } from '../release-notes/write'
import { ChangeLogItem } from '../release-notes/model'

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
        const version = releaseNotes.versions.find(v =>
            v.version.toLowerCase().includes(parts[0].toLowerCase()))
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

    if (parts.length === 2) {
        let fromIsExclusive = false
        // We have a range, is it open ended?
        const range = {
            from: parts[0].toLowerCase(),
            to: parts[1].toLowerCase(),
        }

        if (range.from[0] === '[' && range.from[range.from.length - 1] === ']') {
            fromIsExclusive = true
            range.from = range.from.slice(1, range.from.length - 1)
        }

        let toFound = false
        let fromFound = false

        type Acc = {
            changes: ChangeLogItem[],
            summaries: string[],
        }
        const allChanges = releaseNotes.versions.reduceRight<Acc>((acc, val) => {
            if (range.to && val.version.toLowerCase().includes(range.to)) {
                toFound = true
            }
            if (!range.from || val.version.toLowerCase().includes(range.from)) {
                fromFound = true
                if (fromIsExclusive) {
                    return acc
                }
            }

            if (fromFound && !toFound) {
                acc.changes.push(...val.changeLogs)
                if (val.summary) { acc.summaries.push(val.summary) }
            }

            return acc
        }, { changes: [], summaries: [] })

        return formatVersionChanges(
            allChanges.summaries.join('\n'),
            allChanges.changes,
            releaseNotes.formattingData || defaultFormattingInfo,
        )
    }

    // tslint:disable-next-line:no-string-throw
    throw 'Spec is not valid, should be in format <version> or [<fromversion>]...[<toversion>]'
}
