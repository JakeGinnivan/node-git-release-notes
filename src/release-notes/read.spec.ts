import { fromMarkdown } from './read'

it('parses single version properly', () => {
    const releaseNotes = fromMarkdown(
        `# Changelog
## v2.0.0
- List 1
- List 2`,
        'filename.md',
    )

    expect(releaseNotes).toMatchSnapshot()
})
