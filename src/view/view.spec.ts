import { extractChanges } from './view'

it('Can get changes for a single version', () => {
    const changes = extractChanges('file.md', `# Changelog

## v2.0.0
- Change 1
- Change 2
  - Change 2.1

## v1.0.0
- Change 0
`, '2.0.0')

    expect(changes).toMatchSnapshot()
})
