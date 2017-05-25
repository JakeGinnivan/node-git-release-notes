import glob from '../utils/glob'
import releaseFile from './release-file'

export default async (fileGlob: string, version: string) => {
    const files = await glob(fileGlob, {
        nocase: true
    })

    await Promise.all(files.map(async file => await releaseFile(file, version)))
}