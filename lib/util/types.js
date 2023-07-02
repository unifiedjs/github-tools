/**
 * @typedef {import('@octokit/types').RequestInterface<object>} Request
 * @typedef {import('@octokit/plugin-paginate-rest').PaginateInterface} Paginate
 * @typedef {import('@octokit/graphql').graphql} GraphQl
 *
 * @typedef {'WRITE'} HumanPermission
 * @typedef {'ADMIN' | 'MAINTAIN' | 'TRIAGE' | 'WRITE'} GithubTeamPermission
 *
 * @typedef {'contributor' | 'maintainer' | 'member' | 'merger' | 'releaser'} Role
 *
 * @typedef Repo
 * @property {string} name
 * @property {string} nameWithOwner
 * @property {boolean} isArchived
 *
 * @typedef TeamInfo
 * @property {string} id
 * @property {string} description
 * @property {string} privacy
 * @property {{id?: string | undefined}} parentTeam
 *
 * @typedef GithubTeam
 * @property {string} name
 * @property {string} [parent]
 * @property {string} description
 * @property {string} scope
 * @property {GithubTeamPermission} permission
 * @property {string} member
 * @property {string} maintainer
 *
 * @typedef Team
 * @property {string} name
 *   Name of unified team (example: `'remark'`, `'core'`).
 * @property {boolean} [collective]
 *   Whether this is a collective (overarching) team.
 * @property {string} [lead]
 *   GH handle of team lead (when not a collective team) (example: `'wooorm'`).
 * @property {Record<string, Role>} humans
 *   Map of GH handles to roles (example: `{wooorm: 'maintainer'}`).
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
 * @property {'next'} [labels]
 *   Whether to use next generation labels.
 *
 *   To do: remove legacy labels.
 *
 * @typedef Organizations
 * @property {string} owner
 *   Example: `'core/maintainer'`.
 * @property {Array<Organization>} orgs
 *   Organizations.
 *
 * @typedef Human
 * @property {string} name
 * @property {string} email
 * @property {string} [url]
 * @property {string} github
 * @property {string} [npm]
 *
 * @typedef Collaborators
 * @property {string} scope
 * @property {Array<Human>} collaborators
 *
 * @typedef Humans
 * @property {HumanPermission} permission
 * @property {Array<Collaborators>} outsideCollaborators
 *
 *
 * @typedef Context
 *   Context passed around.
 * @property {string} org
 *   GitHub org name (example: `unifiedjs`).
 * @property {string} orgTeam
 *   Name of organization team (example: `unified`).
 * @property {string} collective
 *   Name of the collective (example: `unified`).
 * @property {boolean | undefined} [orgLabelsNext=false]
 *   Whether to use next generation labels.
 *
 *   To do: remove legacy labels.
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
 * @property {never} ghLabels
 *   To do: remove legacy labels.
 * @property {Labels} ghLabelsNext
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
 */

export {}
