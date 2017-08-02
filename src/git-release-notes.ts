import * as program from 'commander'
import { release } from './release/release'

interface Options {
    file: string
    debug: string
    aggregate: string
}

program
    .command('release <version>')
    .description('Finalises release notes for release')
    .option('-f, --file <file>', 'The release notes files to update, supports globs')
    .option('--debug', 'Debug flag to get more information')
    .option('--aggregate', 'Aggregates changelogs in folders into the main one')
    .action((version: string, options: Options) => {
        release(options.file || '**/CHANGELOG.md', version, {
            debug: !!options.debug,
            aggregate: !!options.aggregate,
        })
        .catch((err: string) => {
            console.error('Error occured: ' + err)
            process.exit(1)
        })
    })

program.parse(process.argv)
