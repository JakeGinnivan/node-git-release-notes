import * as fs from 'fs-extra'
import { ReleaseNotesFormattingInfo, ChangeLogItem, ReleaseNotes, Version } from './model'

export const defaultFormattingInfo: ReleaseNotesFormattingInfo = {
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

const formatHeader = (
    text: string, releaseDate: string | undefined, depth: number, link: boolean,
) => `${'#'.repeat(depth)} ${link ? `[${text}]` : text}${releaseDate ? ` - ${releaseDate}` : ''}`

const paragraph = (text: string | undefined) => !text ? '' : text + '\n'

export const formatVersionChanges = (
    versionSummary: string | undefined,
    items: ChangeLogItem[],
    formattingInfo: ReleaseNotesFormattingInfo,
    pad: number = 0,
): string => {
    type Grouped = { [group: string]: ChangeLogItem[] }
    const grouped = items
        .reduce<Grouped>((acc, item) => {
            let group = acc[item.group || '']
            if (!group) {
                group = []
                acc[item.group || ''] = group
            }

            group.push(item)
            return acc
        }, {})

    return paragraph(versionSummary) + Object.keys(grouped)
        .map(group => {
            const formattedGroup = grouped[group]
                .map(change => {
                    const nested = change.children
                        ? '\n' + formatVersionChanges(
                            versionSummary, change.children, formattingInfo, pad + 2)
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
                const headerMd = '#'.repeat(formattingInfo.versionsDepth + 1)
                return `${headerMd} ${group}\n${formattedGroup}\n`
            }
            return formattedGroup
        })
        .join('\n')
}
const formatVersions = (versions: Version[], formattingInfo: ReleaseNotesFormattingInfo) => {
    return versions.map(version => (
        `${formatHeader(version.version, version.releaseDate, formattingInfo.versionsDepth, true)}
${formatVersionChanges(version.summary, version.changeLogs, formattingInfo)}`
    )).join('\n')
}

export const toMarkdown = (releaseNotes: ReleaseNotes) => {
    const formattingInfo = releaseNotes.formattingData || defaultFormattingInfo

    return `${formatHeader(releaseNotes.title, undefined, formattingInfo.titleDepth, false)}
${paragraph(releaseNotes.summary)}
${formatVersions(releaseNotes.versions, formattingInfo)}`
}
