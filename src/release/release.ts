import * as fs from 'fs-extra'
import glob from '../utils/glob'
import { ReadOptions, fromMarkdown } from '../release-notes/read'
import { updateRelease } from './update-release'
import { toMarkdown } from '../release-notes/write'
import { ReleaseNotes } from '../release-notes/model'

export type ReleaseOptions = ReadOptions & {
    aggregate: boolean,
}

export const release = async (fileGlob: string, version: string, options: ReleaseOptions) => {
    const files = await glob(fileGlob, {
        nocase: true,
        debug: options.debug,
        ignore: 'node_modules/**',
    })

    const changelogFiles = await Promise.all(files.map<Promise<ChangeLogFile>>(async file => ({
        filename: file,
        releaseNotes: (await fs.readFile(file)).toString(),
    })))

    const processedFiles = processFiles(changelogFiles, version, options)

    for (const processed of processedFiles) {
        await fs.writeFile(processed.filename, processed.releaseNotes)
    }
}

export type ChangeLogFile = {
    filename: string,
    releaseNotes: string,
}

export const processFiles = (
    files: ChangeLogFile[], version: string, options: ReleaseOptions,
) => {
    // tslint:disable-next-line:no-console
    console.log('Processing: \n', files.map(f => f.filename).join('\n'))
    const releaseNotesFiles = files.map(file => {
        const releaseNotes = fromMarkdown(file.releaseNotes, file.filename, options)

        return {
            filename: file.filename,
            releaseNotes,
        }
    })

    const rootFiles = releaseNotesFiles.filter(update => update.filename.indexOf('/') === -1)
    const rootFile = rootFiles[0]
    if (options.aggregate) {
        if (!rootFile) {
            // tslint:disable-next-line:no-string-throw
            throw 'Cannot find root changelog'
        }

        // Remove the root file, we will update after
        const rootFileIndex = releaseNotesFiles.indexOf(rootFile)
        releaseNotesFiles.splice(rootFileIndex, 1)
    }

    for (const releaseFile of releaseNotesFiles) {
        const updateResult = updateRelease(releaseFile.releaseNotes, version)

        if (updateResult && rootFile) {
            const rootVersionToUpdate = rootFile.releaseNotes.versions[0]
            rootVersionToUpdate.changeLogs.forEach(changeLogItem => {
                const pathSections = releaseFile.filename.split('/')
                // Take the folder of the changelog, group the changelog items under that
                changeLogItem.group = pathSections[pathSections.length - 2]
                rootVersionToUpdate.changeLogs.push(changeLogItem)
            })
        }
    }

    const results: ChangeLogFile[] = releaseNotesFiles
            .map(file => ({
                filename: file.filename,
                releaseNotes: toMarkdown(file.releaseNotes),
            }))

    if (options.aggregate) {
        // We have to write root
        results.push({
            filename: rootFile.filename,
            releaseNotes: toMarkdown(rootFile.releaseNotes),
        })
    }

    return results
}
