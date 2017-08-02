import * as marked from 'marked'

interface ListStart {
    type: 'list_start',
    ordered: boolean
}
interface ListEnd {
    type: 'list_end',
    ordered: boolean
}
interface ListItemStart { type: 'list_item_start' | 'loose_item_start' }
interface ListItemEnd { type: 'list_item_end' }
interface Paragraph {
    type: 'paragraph'
    text: string
}
interface Text {
    type: 'text'
    text: string
}
interface Space {
    type: 'space'
    text: undefined
}
interface Heading {
    type: 'heading'
    depth: number
    text: string
}
export type Token = Heading | Paragraph | Text | Space
    | ListStart | ListEnd
    | ListItemStart | ListItemEnd
    | { type: 'unknown' }

export default (fileContents: string) =>
    marked.lexer(fileContents.toString()) as (Token[] & { links: {} })
