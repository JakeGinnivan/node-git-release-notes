import * as fs from 'fs-extra'
import glob from '../utils/glob'
import parse, { Token } from './parse'
import releaseFile from './release-file'
import tokensToReleaseNotes from './tokens-to-releasenotes'
import { ChangeLogItem } from './tokens-to-changelog'
import releaseNotesGenerator from './release-notes-generator'

export default async (fileGlob: string, version: string, options: { debug: boolean, aggregate: boolean }) => {
    const files = await glob(fileGlob, {
        nocase: true,
        debug: options.debug,
        ignore: 'node_modules/**'
    })

    console.log('Processing: \n', files.join('\n'))

    const updates = await Promise.all(files.map(async file => {
        try {
            const updatedVersion = await releaseFile(file, version, options)
            return {
                success: true as true,
                file,
                versionInfo: updatedVersion,
            }
        } catch (err) {
            console.error(err)
            return {
                success: false as false,
                file,
                error: err
            }
        }
    }))

    if (options.aggregate) {
        const rootFiles = updates.filter(update => update.file.indexOf('/') === -1)
        if (rootFiles.length === 0) {
            throw 'Cannot file root changelog'
        }
        const rootFile = rootFiles[0]
        const fileContents = await fs.readFile(rootFile.file)
        const tokens = parse(fileContents.toString())
        const releaseNotes = tokensToReleaseNotes(tokens, rootFile.file, options || { debug: true })
        if (!releaseNotes) {
            throw 'Can\'t read root changelog'
        }

        console.log(`Aggregating release notes for ${version} to main changelog file: ${rootFile}`)
        const allUpdates = await Promise.all(updates
            .filter(update => (
                update.file.indexOf('/') != -1 // Not root file
                && update.success
                && update.versionInfo
            ))
            .map(async update => {
                const fileContents = await fs.readFile(update.file)
                const tokens = parse(fileContents.toString())
                const releaseNotes = tokensToReleaseNotes(tokens, update.file, options || { debug: true })
                if (!releaseNotes) {
                    return
                }

                return {
                    file: update.file,
                    releaseNotes: releaseNotes.versions[0]
                }
            }))

        const flatUpdates = allUpdates
            .reduce((acc, val) => {
                if (val) {
                    val.releaseNotes.changeLogs.forEach(logEntry => {
                        logEntry.group = val.file
                        acc.push(logEntry)
                    })
                }

                return acc
            }, [] as ChangeLogItem[])

        if (releaseNotes.versions[0].version.indexOf(version) === -1) {
            const date = new Date()
            const releaseDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
            // Can't fild the version.. lets create it
            releaseNotes.versions.unshift({
                version: `[${version}] - `,
                changeLogs: flatUpdates,
                releaseDate,
            })
        } else {
            releaseNotes.versions[0].changeLogs.push(...flatUpdates)
        }

        const newRootReleasNotes = releaseNotesGenerator(releaseNotes)
        await fs.writeFile(rootFile.file, newRootReleasNotes)
    }
}