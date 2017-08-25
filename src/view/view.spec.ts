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

it('Can get changes after a version', () => {
    const changes = extractChanges('file.md', `# Changelog

## v3.0.0
- Change 3
- Change 4

## v2.0.0
- Change 1
- Change 2
  - Change 2.1

## v1.0.0
- Change 0
`, '2.0.0...')

    expect(changes).toMatchSnapshot()
})

it('Can get changes before a version', () => {
    const changes = extractChanges('file.md', `# Changelog

## v3.0.0
- Change 3
- Change 4

## v2.0.0
- Change 1
- Change 2
  - Change 2.1

## v1.0.0
- Change 0
`, '...3.0.0')

    expect(changes).toMatchSnapshot()
})

it('Can get changes between versions', () => {
    const changes = extractChanges('file.md', `# Changelog

## v3.0.0
- Change 3
- Change 4

## v2.0.1
- Fix 1

## v2.0.0
- Change 1
- Change 2
  - Change 2.1

## v1.0.0
- Change 0
`, '2.0.0...3.0.0')

    expect(changes).toMatchSnapshot()
})

it('Can get changes after the latest', () => {
    const changes = extractChanges('file.md', `# Changelog

## v2.0.0
- Change 1
- Change 2
  - Change 2.1

## v1.0.0
- Change 0
`, '2.0.0...')

    expect(changes).toMatchSnapshot()
})

it('Can get changes for vNext', () => {
    const changes = extractChanges('file.md', `# Changelog

## v2.0.0
- Change 1
- Change 2
  - Change 2.1

## v1.0.0
- Change 0
`, '[2.0.0]...')

    expect(changes).toMatchSnapshot()
})
