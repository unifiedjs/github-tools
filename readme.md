# GitHub tools

This projects manages the [unified][] organizations on GitHub:

* check org admins: rights, missing, unexpected
* check repos, their collaborators, and their labels
* check teams: their description, privacy, and if they exist
* check team members: rights, missing, unexpected
* check team repos

These tools automatically add repositories, teams, members, maintainers, and
collaborators where needed, and warns about incorrectly configured entities.

Most of this is hardcoded to work for unified.
In the future we hope to allow other collectives to use this as well.

These tools work well with our [`npm-tools`][npm-tools].
The plan is to merge them together in some pluggable way in the future.

P.S. to run this, you need a `GH_TOKEN` or `GITHUB_TOKEN` in env.

[unified]: https://github.com/unifiedjs

[npm-tools]: https://github.com/unifiedjs/npm-tools
