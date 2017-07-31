import releaseNotesUpdater from '../../release/release-notes-updater'

it('Gives error on file', () => {
    expect(() => releaseNotesUpdater('', 'v1.0.0', 'path/to/CHANGELOG.md'))
        .toThrow('No release notes to update')
})

it('Supports just a top level title', () => {
    expect(releaseNotesUpdater('# Changelog', 'v1.0.0', 'path/to/CHANGELOG.md'))
        .toMatchSnapshot()
})

it('Supports having a changelog description', () => {
    expect(releaseNotesUpdater(`# Changelog
This is a changelog`, 'v1.0.0', 'path/to/CHANGELOG.md'))
        .toMatchSnapshot()
})

it('Supports having a empty vNext version', () => {
    expect(releaseNotesUpdater(`# Changelog

## vNext`, 'v1.0.0', 'path/to/CHANGELOG.md'))
        .toMatchSnapshot()
})

it('Supports vnext with issues', () => {
    expect(releaseNotesUpdater(`# Changelog

## vNext
- A change`, 'v1.0.0', 'path/to/CHANGELOG.md'))
        .toMatchSnapshot()
})

it('Supports different leveled headings with issues', () => {
    expect(releaseNotesUpdater(`## Changelog

### vNext
- A change`, 'v1.0.0', 'path/to/CHANGELOG.md'))
        .toMatchSnapshot()
})

it('Supports different leveled headings with issues 2', () => {
    expect(releaseNotesUpdater(`# Changelog

### vNext
- A change`, 'v1.0.0', 'path/to/CHANGELOG.md'))
        .toMatchSnapshot()
})

it('Does not add release when no vnext entry and existing entires exist', () => {
    expect(releaseNotesUpdater(`# Changelog

### v0.1.0
- A change`, 'v1.0.0', 'path/to/CHANGELOG.md'))
        .toMatchSnapshot()
})

it('Can process multiple versions', () => {
    expect(releaseNotesUpdater(`# Changelog

### v0.2.0
- A change

### v0.1.0
- A change`, 'v1.0.0', 'path/to/CHANGELOG.md'))
        .toMatchSnapshot()
})

it('Can handle multiple levels of lists', () => {
    expect(releaseNotesUpdater(`# Changelog

### v0.2.0
- A change
  * Nested
    * Nested 2

### v0.1.0
- A change`, 'v1.0.0', 'path/to/CHANGELOG.md'))
        .toMatchSnapshot()
})

it('Maintains blank lines', () => {
    expect(releaseNotesUpdater(`# Changelog

### v0.2.0
- A change

- Another change

### v0.1.0
- A change`, 'v1.0.0', 'path/to/CHANGELOG.md'))
        .toMatchSnapshot()
})