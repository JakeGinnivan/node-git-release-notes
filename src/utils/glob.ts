import * as glob from 'glob'

export default (pattern: string, options?: glob.IOptions): Promise<string[]> => {
    return new Promise<string[]>((resolve, reject) => {
        const handler = (err: Error, files: string[]) => {
            if (err) {
                return reject(err)
            }

            return resolve(files)
        }

        if (options) {
            return glob(pattern, options, handler)
        }

        glob(pattern, handler)
    })
}
