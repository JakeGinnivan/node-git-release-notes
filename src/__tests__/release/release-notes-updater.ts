import { processFiles } from '../../release/release'

const verifyChangelog = (changelog: string, version = 'v1.0.0') => {
    const output = processFiles([{
        filename: 'path/to/CHANGELOG.md',
        releaseNotes: changelog,
    }], version, { debug: true, aggregate: false })

    return output[0].releaseNotes.replace(/\d+\/\d+\/\d+/, '<date>')
}

it('Gives error on file', () => {
    expect(() => verifyChangelog(''))
        .toThrow('No release notes to update')
})

it('Supports just a top level title', () => {
    expect(verifyChangelog('# Changelog'))
        .toMatchSnapshot()
})

it('Supports having a changelog description', () => {
    expect(verifyChangelog(`# Changelog
This is a changelog`))
        .toMatchSnapshot()
})

it('Supports having a empty vNext version', () => {
    expect(verifyChangelog(`# Changelog

## vNext`))
        .toMatchSnapshot()
})

it('Supports vnext with issues', () => {
    expect(verifyChangelog(`# Changelog

## vNext
- A change`))
        .toMatchSnapshot()
})

it('Supports different leveled headings with issues', () => {
    expect(verifyChangelog(`## Changelog

### vNext
- A change`))
        .toMatchSnapshot()
})

it('Supports different leveled headings with issues 2', () => {
    expect(verifyChangelog(`# Changelog

### vNext
- A change`))
        .toMatchSnapshot()
})

it('Does not add release when no vnext entry and existing entires exist', () => {
    expect(verifyChangelog(`# Changelog

### v0.1.0
- A change`))
        .toMatchSnapshot()
})

it('Can process multiple versions', () => {
    expect(verifyChangelog(`# Changelog

### v0.2.0
- A change

### v0.1.0
- A change`))
        .toMatchSnapshot()
})

it('Can handle multiple levels of lists', () => {
    expect(verifyChangelog(`# Changelog

### v0.2.0
- A change
  * Nested
    * Nested 2

### v0.1.0
- A change`))
        .toMatchSnapshot()
})

it('Maintains blank lines', () => {
    expect(verifyChangelog(`# Changelog

### v0.2.0
- A change

- Another change

### v0.1.0
- A change`))
        .toMatchSnapshot()
})

it('Can start with multiple text blocks', () => {
    expect(verifyChangelog(`# Changelog

## vNext

GPT ads are now lazy-loaded by default.
Changed props:

\`<GptAdSlot>\`
* \`disabled\`: Set to asdasdasdsad....

Info

SlotDefinition at \`<GptAdProvider>\` level
* \`disableLazyLoading\`: Always load this slot independently of its viewport position

Bit ol multiline

description
`, 'v2.0.0'))
        .toMatchSnapshot()
})

it('Can group change logs by type', () => {
    expect(verifyChangelog(`# Changelog

## vNext
### Fixes
- Something
- Something else

### Features
- New feature 1
`, 'v2.0.0'))
        .toMatchSnapshot()
})

it('Can parse already parsed doc', () => {
    expect(verifyChangelog(`# Changelog

## [1.0.0]
### Fixes
- Something
- Something else

### Features
- New feature 1
`, 'v2.0.0'))
        .toMatchSnapshot()
})

it ('Aggregates correctly', () => {
    const output = processFiles([{
        filename: 'path/to/CHANGELOG.md',
        releaseNotes: `# Changelog

## vnext
- Test function
`,
    }, {
        filename: 'CHANGELOG.md',
        releaseNotes: `# Changelog

## [v1.0.0]
- Old release
`,
    }], 'v2.0.0', { debug: true, aggregate: true })

    expect(output[1].releaseNotes.replace(/\d+\/\d+\/\d+/, '<date>')).toMatchSnapshot()
})
