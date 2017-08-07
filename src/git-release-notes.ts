import * as program from 'commander'
import { release } from './release/release'
import { view } from './view/view'

interface ReleaseOptions {
    file: string
    debug: string
    aggregate: string
}

interface ViewOptions {
    file: string
}

program
    .command('release <version>')
    .description('Finalises release notes for release')
    .option('-f, --file <file>', 'The release notes files to update, supports globs')
    .option('--debug', 'Debug flag to get more information')
    .option('--aggregate', 'Aggregates changelogs in folders into the main one')
    .action((version: string, options: ReleaseOptions) => {
        release(options.file || '**/CHANGELOG.md', version, {
            debug: !!options.debug,
            aggregate: !!options.aggregate,
        })
        .catch((err: string) => {
            console.error('Error occured: ' + err)
            process.exit(1)
        })
    })

program
    .command('view <version spec>')
    // tslint:disable-next-line:max-line-length
    .description('Prints the changes for a version or a range, ie <version>...<version> or ...<version> or <version>...')
    .option('-f, --file <file>', 'The release notes file to read from, default CHANGELOG.md')
    .action((versionSpec: string, options: ViewOptions) => {
        view(options.file || 'CHANGELOG.md', versionSpec)
        .then(result => {
            // tslint:disable-next-line:no-console
            console.log(result)
        })
        .catch((err: string) => {
            console.error('Error occured: ' + err)
            process.exit(1)
        })
    })

program.parse(process.argv)
