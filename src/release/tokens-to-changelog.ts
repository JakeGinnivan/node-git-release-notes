import { Token } from './parse'
import { Options } from './options'

export interface ChangeLogItem {
    description: string
    additionalNotes?: ChangeLogItem[]
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
    if (tokens[0].type !== 'list_start') throw 'Expecting list_start'
    if (tokens[tokens.length - 1].type !== 'list_end') throw 'Expecting list_end'

    let parents: ChangeLogAccumulator[] = []
    let skipListStart = false
    let isLooseListItem = false
    const innerItems = tokens
        .slice(1, tokens.length - 2)

    return innerItems
        .reduce((acc, token) => {
            if (token.type === 'list_item_start' || token.type === 'loose_item_start') {
                if (acc.lastToken !== '' && acc.lastToken !== 'list_item_end') {
                    let msg = `Not expecting list_item_start after ${acc.lastToken} in ${filename} -> ${version}`
                    if (options.debug) {
                        msg += '\n\nAST:\n' + JSON.stringify(tokens)
                    }

                    throw msg
                }
                isLooseListItem = token.type === 'loose_item_start'
                acc.lastToken = 'list_item_start'
            }

            if (token.type === 'text' || token.type === 'paragraph' || token.type === 'space') {
                if (acc.lastToken === 'text' || token.type === 'paragraph' || token.type === 'space') {
                    const lastItem = acc.items[acc.items.length - 1]
                    lastItem.description += '\n' + (token.text || '')
                    return acc
                }
                if (acc.lastToken !== 'list_item_start') {
                    let msg = `Expecting text after list_item_start not ${acc.lastToken} in ${filename} -> ${version}`
                    if (options.debug) {
                        msg += '\n\nAST:\n' + JSON.stringify(tokens)
                    }

                    throw msg
                }
                acc.lastToken = token.type
                acc.items.push({
                    description: token.text
                })
            }

            if (token.type === 'list_start') {
                if (skipListStart) {
                    skipListStart = false
                    return acc
                }
                const lastItem = acc.items[acc.items.length - 1]
                const items: ChangeLogItem[] = []
                lastItem.children = items
                parents.push(acc)
                return {
                    lastToken: '',
                    items: items,
                }
            }

            if (token.type === 'list_end') {
                const parent = parents.pop()
                if (!parent) {
                    // This happens when we have multiple 'lists' inside a version.
                    // We need to skip the next list_start
                    skipListStart = true
                    return acc
                }

                return parent
            }

            if (token.type === 'list_item_end') {
                if (isLooseListItem) {
                    const lastItem = acc.items[acc.items.length - 1]
                    lastItem.description += '\n'
                }
                acc.lastToken = token.type
            }

            return acc
        }, { lastToken: '', items: [] } as ChangeLogAccumulator)
        .items
}