import { Token } from './parse'

export interface ChangeLogItem {
    description: string
    additionalNotes?: ChangeLogItem[]
}

export default (tokens: Token[]): ChangeLogItem[] => {
    const changeLogItems: ChangeLogItem[] = []
    // Check our first item is a list_start and last is list_end
    if (tokens.length === 0) return changeLogItems
    if (tokens[0].type !== 'list_start') throw 'Expecting list_start'
    if (tokens[tokens.length - 1].type !== 'list_end') throw 'Expecting list_end'

    return tokens
        .slice(1, tokens.length - 2)
        .reduce((acc, token) => {
            if (token.type === 'list_item_start') {
                if (acc.lastToken !== '' && acc.lastToken !== 'list_item_end') {
                    throw `Not expecting list_item_start after ${token.type}`
                }
                acc.lastToken = token.type
            }

            if (token.type === 'text') {
                if (acc.lastToken !== 'list_item_start') {
                    throw `Expecting text after list_item_start not ${acc.lastToken}`
                }
                acc.lastToken = token.type
                acc.items.push(token.text)
            }

            return acc
        }, { lastToken: '' as string, items: [] as string[] })
        .items.map(i => ({ description: i }))
}