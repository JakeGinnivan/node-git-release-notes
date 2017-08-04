# git-release-notes

A small node utility to help manage changelogs

## CLI
### release
The release command will update all changelogs in the repository with the version number. When you are preparing a version use `vNext` as a placeholder.

`release-preparer release v42.0.0 [--file CHANGELOG.md] [--aggregate]`

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

### view
Allows you to get all changes for a version, or a range of versions. For example

`release-preparer view 1.0.0...3.0.0`

You can specify a single version and open ended ranges as well like `release-preparer view ...3.0.0` which is all changes before v3 (excusive).

From is inclusive, to is exclusive