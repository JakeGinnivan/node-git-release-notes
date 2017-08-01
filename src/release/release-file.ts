import * as fs from 'fs-extra'
import updateReleaseNotes from './release-notes-updater'
import { Options } from './options'

export default async (file: string, version: string, options: Options) => {
    const fileContents = await fs.readFile(file)

    const updatedReleaseNotes = updateReleaseNotes(fileContents.toString(), version, file, options)
    await fs.writeFile(file, updatedReleaseNotes.newReleaseNotesFile)

    return updatedReleaseNotes.currentVersion
}