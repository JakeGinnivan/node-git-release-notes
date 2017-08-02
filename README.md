# git-release-notes

A small node utility to help manage changelogs

## CLI
### release
The release command will update all changelogs in the repository with the version number. When you are preparing a version use `vNext` as a placeholder.

`git-release-notes release v42.0.0 [--file CHANGELOG.md] [--aggregate]`

For example:

```
vNext
 - Some change
 - Another change

v41.0.0
 - Added something
```

Will change to

```
v42.0.0
 - Some change
 - Another change

v41.0.0
 - Added something
```

#### --aggregate
Takes the release notes for all nested CHANGELOG files and aggregates them into a changelog file at the root of the repository.

This is handy if you have multiple components or more granular changelogs.