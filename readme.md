# GitHub Tools

This projects manages the [unified][] organisations on GitHub:

*   Check org admins: rights, missing, unexpected
*   Check repos and their collaborators
*   Check teams: their description, privacy, and if they exist
*   Check team members: rights, missing, unexpected
*   Check team repos

These tools automatically add repositories, teams, members, maintainers, and
collaborators where needed, and warns about incorrectly configured entities.

Most of this is hardcoded to work for unified.
In the future we hope to allow other collectives to use this as well.

These tools work well with our [`npm-tools`][npm-tools].
The plan is to merge them together in some pluggable way in the future.

[unified]: https://github.com/unifiedjs

[npm-tools]: https://github.com/unifiedjs/npm-tools
