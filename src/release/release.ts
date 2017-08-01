import glob from '../utils/glob'
import releaseFile from './release-file'

export default async (fileGlob: string, version: string, options: { debug: boolean }) => {
    const files = await glob(fileGlob, {
        nocase: true,
        debug: options.debug,
        ignore: 'node_modules/**'
    })

    console.log('Processing: \n', files.join('\n'))

    await Promise.all(files.map(async file => await releaseFile(file, version, options)))
}