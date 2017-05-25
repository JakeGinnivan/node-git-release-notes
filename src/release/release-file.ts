import * as fs from 'fs-extra'
import parse, { Token } from './parse'
import generateChangeLogFromTokens, { ChangeLogItem } from './tokens-to-changelog'

interface Version {
    version: string
    summary?: string
    releaseDate?: string
    changeLogs: ChangeLogItem[]
}

interface ReleaseNotes {
    title: string
    summary?: string
    versions: Version[]
}

export default async (file: string, version: string) => {
    const fileContents = await fs.readFile(file)
    const tokens = parse(fileContents.toString())
    if (tokens.length === 0) {
        console.warn(`Empty changelog at ${file}`)
        return
    }

    const title = tokens.splice(0, 1)[0]
    if (title.type !== 'heading') {
        console.error('Expected first line to be a heading')
        return
    }

    const releaseNotes: ReleaseNotes = {
        title: title.text,
        versions: []
    }
    let token: Token | undefined

    token = tokens.shift(); if (!token) return
    // Check to see if we have a changelog summary
    if (token.type === 'paragraph') {
        releaseNotes.summary = token.text
        token = tokens.shift(); if (!token) return
    }

    // Now we have title and summary parsed, next token should be a heading
    if (token.type !== 'heading') {
        console.error(`Expecting a heading for the version, found ${token.type}`)
        return
    }

    // Version numbers all need to be the same heading (but we should accept ## or ### or ####)
    const versionsDepth = token.depth
    const groupedTokens = tokens.reduce((agg, v) => {
        if (v.type === 'heading' && v.depth === versionsDepth) {
            // Hit the next version, so start collecting tokens against it
            agg.push({ version: v.text, tokens: [] })
        } else {
            // Add the token to the last version
            agg[agg.length - 1].tokens.push(v)
        }

        return agg
    }, [{ version: token.text, tokens: [] as Token[] }])

    releaseNotes.versions = groupedTokens.map(v => {
        // Check to see if the first token is a paragraph, which would be a version summary
        let summary: string | undefined = undefined
        if (v.tokens.length > 0) {
            const peeked = v.tokens[0]
            if (peeked.type === 'paragraph') {
                v.tokens.shift()
                // We have a version summary
                summary = peeked.text
            }
        }

        return {
            version: v.version,
            summary,
            changeLogs: generateChangeLogFromTokens(v.tokens)
        }
    })

    console.log(groupedTokens)
    console.log(JSON.stringify(releaseNotes))
}