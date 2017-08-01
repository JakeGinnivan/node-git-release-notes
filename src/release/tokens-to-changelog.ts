import { Token } from './parse'
import { Options } from './options'

export interface ChangeLogItem {
    description: string
    kind: 'list-item' | 'text' | 'paragraph'
    /** For example feature, fix etc */
    group: string | undefined
    prefix: string | undefined
    children?: ChangeLogItem[]
}

export interface ChangeLogAccumulator {
    lastToken: string
    items: ChangeLogItem[]
}

export default (tokens: Token[], filename: string, version: string, options: Options): ChangeLogItem[] => {
    let parents: ChangeLogAccumulator[] = []
    let isLooseListItem = false
    let isInList = false
    let currentGroup: string | undefined

    return tokens
        .reduce((acc, token) => {
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
                    items: items,
                }
            }

            if (token.type === 'list_item_start' || token.type === 'loose_item_start') {
                if (acc.lastToken !== 'list_start' && acc.lastToken !== 'list_item_end') {
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
                    prefix: undefined
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
                    prefix: undefined
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
        }, { lastToken: '', items: [] } as ChangeLogAccumulator)
        .items
}