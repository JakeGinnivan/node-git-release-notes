import * as fs from 'fs-extra'
import updateReleaseNotes from './release-notes-updater'

export default async (file: string, version: string) => {
    const fileContents = await fs.readFile(file)

    const updatedReleaseNotes = updateReleaseNotes(fileContents.toString(), version)
    await fs.writeFile(file, updatedReleaseNotes)
}