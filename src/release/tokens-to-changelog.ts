import { Token } from './parse'
import { Options } from './options'

export interface ChangeLogItem {
    description: string
    type: 'list-item' | 'text' | 'paragraph'
    children?: ChangeLogItem[]
}

export interface ChangeLogAccumulator {
    lastToken: string
    items: ChangeLogItem[]
}

export default (tokens: Token[], filename: string, version: string, options: Options): ChangeLogItem[] => {
    const changeLogItems: ChangeLogItem[] = []
    // Check our first item is a list_start and last is list_end
    if (tokens.length === 0) return changeLogItems

    let parents: ChangeLogAccumulator[] = []
    let isLooseListItem = false
    let isInList = false

    return tokens
        .reduce((acc, token) => {
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
                    type: 'list-item'
                })
                acc.lastToken = 'list_item_start'
            }

            if (token.type === 'text' || token.type === 'paragraph' || token.type === 'space') {
                if (isInList) {
                    const lastItem = acc.items[acc.items.length - 1]
                    lastItem.description += (lastItem.description ? '\n' : '') + (token.text || '')
                    return acc
                }
                acc.lastToken = token.type
                acc.items.push({
                    description: token.text || '',
                    type: token.type === 'paragraph' ? 'paragraph' : 'text'
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