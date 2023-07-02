/**
 * @typedef {import('@octokit/graphql').graphql} GraphQl
 * @typedef {import('@octokit/plugin-paginate-rest').PaginateInterface} Paginate
 * @typedef {import('@octokit/types').RequestInterface<object>} Request
 */

/**
 * @typedef Collaborators
 * @property {string} scope
 * @property {Array<Human>} collaborators
 *
 * @typedef Context
 *   Context passed around.
 * @property {string} org
 *   GitHub org name (example: `unifiedjs`).
 * @property {string} orgTeam
 *   Name of organization team (example: `unified`).
 * @property {string} collective
 *   Name of the collective (example: `unified`).
 * @property {GraphQl} ghQuery
 *   Send a request to the GitHub GQL API.
 * @property {Request} ghRequest
 *   Send a request to the GitHub REST API.
 * @property {Paginate} ghPaginate
 *   Send a paginate request to the GitHub REST API.
 * @property {string} ghToken
 *   GH token.
 * @property {Humans} ghHumans
 *   Humans (see `github-humans.yml`).
 * @property {Labels} ghLabels
 *   Labels.
 * @property {Organizations} ghOrgs
 *   Organizations.
 * @property {Array<GithubTeam>} ghTeams
 *   Teams.
 * @property {Array<Team>} teams
 *   All teams.
 * @property {Array<Human>} humans
 *   All humans.
 * @property {Array<Repo> | undefined} [repositories]
 *   Repositories when iteracting an organization.
 *
 * @typedef GithubTeam
 * @property {string} name
 * @property {string | undefined} [parent]
 * @property {string} description
 * @property {string} scope
 * @property {GithubTeamPermission} permission
 * @property {string} member
 * @property {string} maintainer
 *
 * @typedef {'ADMIN' | 'MAINTAIN' | 'TRIAGE' | 'WRITE'} GithubTeamPermission
 *
 * @typedef Human
 * @property {string} name
 * @property {string} email
 * @property {string | undefined} [url]
 * @property {string} github
 * @property {string | undefined} [npm]
 *
 * @typedef Humans
 * @property {'WRITE'} permission
 * @property {Array<Collaborators>} outsideCollaborators
 *
 * @typedef Label
 * @property {string} name
 *   Example: `'📦 area/deps'`.
 * @property {string} description
 *   Example: `'This affects dependencies'`.
 * @property {string} slug
 *   Example: `'area/deps'`.
 * @property {string} color
 *   Example: `'1366c4'`.
 *
 * @typedef Labels
 * @property {Array<string>} remove
 *   Labels to remove (example: `['greenkeeper']`).
 * @property {Record<string, string>} replace
 *   Labels to replace (example: `'documentation'` -> `area/docs`).
 * @property {Array<Label>} add
 *   Labels to add.
 *
 * @typedef Organization
 * @property {string} github
 *   GitHub slug (example: `'unifiedjs'`).
 * @property {string} unified
 *   Name of org (example: `'unified'`).
 *
 * @typedef Organizations
 * @property {string} owner
 *   Example: `'core/maintainer'`.
 * @property {Array<Organization>} orgs
 *   Organizations.
 *
 * @typedef Repo
 * @property {string} name
 * @property {string} nameWithOwner
 * @property {boolean} isArchived
 *
 * @typedef {'contributor' | 'maintainer' | 'member' | 'merger' | 'releaser'} Role
 *
 * @typedef Team
 * @property {string} name
 *   Name of unified team (example: `'remark'`, `'core'`).
 * @property {boolean | undefined} [collective]
 *   Whether this is a collective (overarching) team.
 * @property {string | undefined} [lead]
 *   GH handle of team lead (when not a collective team) (example: `'wooorm'`).
 * @property {Record<string, Role>} humans
 *   Map of GH handles to roles (example: `{wooorm: 'maintainer'}`).
 *
 * @typedef TeamInfo
 * @property {string} id
 * @property {string} description
 * @property {string} privacy
 * @property {{id?: string | undefined}} parentTeam
 */

export {}
