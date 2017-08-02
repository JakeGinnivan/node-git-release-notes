export interface ReleaseNotesFormattingInfo {
    titleDepth: number
    versionsDepth: number
}

export interface ChangeLogItem {
    description: string
    kind: 'list-item' | 'text' | 'paragraph'
    /** For example feature, fix etc */
    group: string | undefined
    prefix: string | undefined
    children?: ChangeLogItem[]
}

export interface Version {
    version: string
    summary?: string
    releaseDate?: string
    changeLogs: ChangeLogItem[]
}

export interface ReleaseNotes {
    title: string
    summary?: string
    versions: Version[]
    formattingData?: ReleaseNotesFormattingInfo
}
