import { ReleaseNotes, ReleaseNotesFormattingInfo, Version } from './tokens-to-releasenotes'
import { ChangeLogItem } from './tokens-to-changelog'

const defaultFormattingInfo: ReleaseNotesFormattingInfo = {
    titleDepth: 1,
    versionsDepth: 2,
}

const header = (text: string, depth: number) => `${'#'.repeat(depth)} ${text}`
const paragraph = (text: string | undefined) => !text ? '' : text + '\n'
const changes = (items: ChangeLogItem[], pad: number = 0): string => {
    return items.map(change => {
        const nested = change.children
            ? '\n' + changes(change.children, pad + 2)
            : ''
        return `${Array(pad + 1).join(' ')} - ${change.description}${nested}`
    }).join('\n')
}
const versions = (versions: Version[], formattingInfo: ReleaseNotesFormattingInfo) => {
    return versions.map(version => {
        return `${header(version.version, formattingInfo.versionsDepth)}
${paragraph(version.summary)}${changes(version.changeLogs)}`
    }).join('\n')
}

export default (releaseNotes: ReleaseNotes) => {
    const formattingInfo = releaseNotes.formattingData || defaultFormattingInfo

    return `${header(releaseNotes.title, formattingInfo.titleDepth)}
${paragraph(releaseNotes.summary)}
${versions(releaseNotes.versions, formattingInfo)}`
}