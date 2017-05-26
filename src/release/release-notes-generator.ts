import { ReleaseNotes, ReleaseNotesFormattingInfo, Version } from './tokens-to-releasenotes'
import { ChangeLogItem } from './tokens-to-changelog'

const defaultFormattingInfo: ReleaseNotesFormattingInfo = {
    titleDepth: 1,
    versionsDepth: 2,
}

const header = (text: string, depth: number) => `${'#'.repeat(depth)} ${text}`
const paragraph = (text: string) => !text ? '' : text + '\n'
const changes = (changes: ChangeLogItem[]) => {
    return changes.map(change => {
        return ` - ${change.description}`
    }).join('\n')
}
const versions = (versions: Version[], formattingInfo: ReleaseNotesFormattingInfo) => {
    return versions.map(version => {
        return `${header(version.version, formattingInfo.versionsDepth)}
${paragraph(version.summary)}${changes(version.changeLogs)}`
    }).join('\n\n')
}

export default (releaseNotes: ReleaseNotes) => {
    const formattingInfo = releaseNotes.formattingData || defaultFormattingInfo

    return `${header(releaseNotes.title, formattingInfo.titleDepth)}
${paragraph(releaseNotes.summary)}
${versions(releaseNotes.versions, formattingInfo)}`
}