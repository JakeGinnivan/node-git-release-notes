import * as fs from 'fs-extra'
import parse, { Token } from '../utils/parse-markdown'
import { ChangeLogItem, ReleaseNotes } from './model'

export type ReadOptions = { debug: boolean }

export const fromMarkdown = (
    markdown: string, filename: string, options?: ReadOptions,
): ReleaseNotes => {
    const tokens = parse(markdown)

    if (tokens.length === 0) {
        // tslint:disable-next-line:no-string-throw
        throw `No release notes to update for ${filename}`
    }
    return tokensToReleaseNotes(tokens, filename, options || { debug: true })
}

const parseHeader = (header: string) => {
    const match = /\[?(.*?)\]?(?: - (\d+\/\d+\/\d+))?$/.exec(header)
    if (!match) { return { version: header, releaseDate: undefined } }
    return {
        version: match[1],
        releaseDate: match[2],
    }
}

const tokensToReleaseNotes = (tokens: Token[], filename: string, options: ReadOptions) => {
    const title = tokens.splice(0, 1)[0]
    if (title.type !== 'heading') {
        let error = `Expected first line to be a heading in ${filename}`
        if (options.debug) {
            error += '\n\nAST:\n', JSON.stringify(tokens)
        }
        throw error
    }
    const releaseNotes: ReleaseNotes = {
        title: title.text,
        versions: [],
    }
    let token: Token | undefined

    // tslint:disable-next-line:curly
    token = tokens.shift(); if (!token) return releaseNotes
    while (token.type === 'paragraph' || token.type === 'text' || token.type === 'space') {
        const additionalLineBreak = token.type === 'paragraph' ? '\n' : ''
        releaseNotes.summary = releaseNotes.summary
            ? `${releaseNotes.summary}\n${additionalLineBreak}${token.text || ''}`
            : `${additionalLineBreak}${token.text}`

        // tslint:disable-next-line:curly
        token = tokens.shift(); if (!token) return releaseNotes
    }

    // Now we have title and summary parsed, next token should be a heading
    if (token.type !== 'heading') {
        let error = `Expecting a heading for the version, found ${token.type} in ${filename}`
        if (options.debug) {
            error += '\n\nAST:\n', JSON.stringify(tokens)
        }
        throw error
    }

    // Version numbers all need to be the same heading (but we should accept ## or ### or ####)
    const versionsDepth = token.depth
    releaseNotes.formattingData = {
        titleDepth: title.depth,
        versionsDepth,
    }
    let header = parseHeader(token.text)
    const groupedTokens = tokens.reduce((agg, v) => {
        if (v.type === 'heading' && v.depth === versionsDepth) {
            header = parseHeader(v.text)
            // Hit the next version, so start collecting tokens against it
            agg.push({ version: header.version, releaseDate: header.releaseDate, tokens: [] })
        } else {
            // Add the token to the last version
            agg[agg.length - 1].tokens.push(v)
        }

        return agg
    }, [{ version: header.version, releaseDate: header.releaseDate, tokens: [] as Token[] }])

    releaseNotes.versions = groupedTokens.map(v => {
        // Check to see if the first token is a paragraph, which would be a version summary
        let summary: string | undefined
        let peekedToken = v.tokens[0]
        while (peekedToken
            && (peekedToken.type === 'paragraph'
                || peekedToken.type === 'text'
                || peekedToken.type === 'space'
            )
        ) {
            const additionalLineBreak = peekedToken.type === 'paragraph' ? '\n' : ''
            summary = summary
                ? `${summary}\n${additionalLineBreak}${peekedToken.text || ''}`
                : `${additionalLineBreak}${peekedToken.text}`
            v.tokens.shift()
            peekedToken = v.tokens[0]
        }

        return {
            version: v.version,
            releaseDate: v.releaseDate,
            summary,
            changeLogs: parseChangeLogVersion(v.tokens, filename, v.version, options),
        }
    })

    return releaseNotes
}

export interface ChangeLogAccumulator {
    lastToken: string
    items: ChangeLogItem[]
}

const parseChangeLogVersion = (
    tokens: Token[], filename: string, version: string, options: ReadOptions,
): ChangeLogItem[] => {
    const parents: ChangeLogAccumulator[] = []
    let isLooseListItem = false
    let isInList = false
    let currentGroup: string | undefined

    return tokens
        .reduce<ChangeLogAccumulator>((acc, token) => {
            if (token.type === 'heading') {
                currentGroup = token.text
            }

            if (token.type === 'list_start') {
                // We are at the top level
                if (!isInList) {
                    isInList = true
                    acc.lastToken = token.type
                    return acc
                }

                const lastItem = acc.items[acc.items.length - 1]
                const items: ChangeLogItem[] = []
                lastItem.children = items
                parents.push(acc)
                return {
                    lastToken: token.type,
                    items,
                }
            }

            if (token.type === 'list_item_start' || token.type === 'loose_item_start') {
                if (acc.lastToken !== 'list_start' && acc.lastToken !== 'list_item_end') {
                    // tslint:disable-next-line:max-line-length
                    let msg = `Not expecting list_item_start after ${acc.lastToken} in ${filename} -> ${version}`
                    if (options.debug) {
                        msg += '\n\nAST:\n' + JSON.stringify(tokens)
                    }

                    throw msg
                }
                isLooseListItem = token.type === 'loose_item_start'
                acc.items.push({
                    description: '',
                    kind: 'list-item',
                    group: currentGroup,
                    prefix: undefined,
                })
                acc.lastToken = 'list_item_start'
            }

            if (token.type === 'text' || token.type === 'paragraph' || token.type === 'space') {
                if (isInList) {
                    const lastItem = acc.items[acc.items.length - 1]
                    // Try to workout prefix if there is nothing in the list
                    if (lastItem.description === '' && token.text) {
                        const split = token.text.split(': ')
                        if (split.length > 1) {
                            lastItem.prefix = split[0]
                            token.text = split.slice(1).join(':')
                        }
                    }

                    lastItem.description += (lastItem.description ? '\n' : '') + (token.text || '')
                    return acc
                }
                acc.lastToken = token.type
                acc.items.push({
                    description: token.text || '',
                    kind: token.type === 'paragraph' ? 'paragraph' : 'text',
                    group: currentGroup,
                    prefix: undefined,
                })
            }

            if (token.type === 'list_item_end') {
                if (isLooseListItem) {
                    const lastItem = acc.items[acc.items.length - 1]
                    lastItem.description += '\n'
                }
                acc.lastToken = token.type
            }

            if (token.type === 'list_end') {
                isInList = parents.length > 0
                const parent = parents.pop()

                if (!parent) {
                    return acc
                }

                return parent
            }

            return acc
        }, { lastToken: '', items: [] })
    .items
}
