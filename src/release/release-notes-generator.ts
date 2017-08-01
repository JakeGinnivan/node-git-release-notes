import { ReleaseNotes, ReleaseNotesFormattingInfo, Version } from './tokens-to-releasenotes'
import { ChangeLogItem } from './tokens-to-changelog'

const defaultFormattingInfo: ReleaseNotesFormattingInfo = {
    titleDepth: 1,
    versionsDepth: 2,
}

const padLeft = (text: string, pad: number) => `${Array(pad + 1).join(' ')}${text}`

const formatDescription = (prefix: string | undefined, description: string, indent: number) => {
    const lines = description.split(/\r?\n/g)
    const formattedListItem = lines
        // We indent to do proper markdown formatting of lists
        .map((line, index) => line.length > 0 ? padLeft(line, index === 0 ? 0 : 4 + indent) : line)
        .join('\n')

    if (prefix) {
        return `${prefix}: ${formattedListItem}`
    }

    return formattedListItem
}

const header = (text: string, depth: number) => `${'#'.repeat(depth)} ${text}`
const paragraph = (text: string | undefined) => !text ? '' : text + '\n'
const changes = (items: ChangeLogItem[], formattingInfo: ReleaseNotesFormattingInfo, pad: number = 0): string => {
    type Grouped = { [group: string]: ChangeLogItem[] }
    const grouped = items
        .reduce((grouped, item) => {
            let group = grouped[item.group || '']
            if (!group) {
                group = []
                grouped[item.group || ''] = group
            }

            group.push(item)
            return grouped
        }, {} as Grouped)

    return Object.keys(grouped)
        .map(group => {
            const formattedGroup = grouped[group]
                .map(change => {
                    const nested = change.children
                        ? '\n' + changes(change.children, formattingInfo, pad + 2)
                        : ''
                    let formattedItem = padLeft(
                        `${change.kind === 'list-item'
                            ? `- ${formatDescription(change.prefix, change.description, pad)}`
                            : change.description
                        }${nested}`,
                        pad)
                        
                    if (change.kind === 'paragraph') {
                        formattedItem += '\n'
                    }
                    return formattedItem
                })
                .join('\n')

            if (group) {
                return `${new Array(formattingInfo.versionsDepth + 1).join('#')} ${group}\n${formattedGroup}`
            }
            return formattedGroup
        })
        .join('\n')
}
const versions = (versions: Version[], formattingInfo: ReleaseNotesFormattingInfo) => {
    return versions.map(version => {
        return `${header(version.version, formattingInfo.versionsDepth)}
${paragraph(version.summary)}${changes(version.changeLogs, formattingInfo)}`
    }).join('\n')
}

export default (releaseNotes: ReleaseNotes) => {
    const formattingInfo = releaseNotes.formattingData || defaultFormattingInfo

    return `${header(releaseNotes.title, formattingInfo.titleDepth)}
${paragraph(releaseNotes.summary)}
${versions(releaseNotes.versions, formattingInfo)}`
}