# Afterlight roadmap

This roadmap reflects the repository audit performed on 11 October 2026. Work is
planned as small, verifiable increments; priorities may change if implementation
reveals data-compatibility or deployment risks.

## Audit baseline

- The app is a single React/TypeScript component with projects, task status/edit/delete,
  idea CRUD, page navigation, and browser `localStorage` persistence.
- Existing data uses `afterlight-workspace-v1`; ideas were added compatibly, but
  persisted records are otherwise trusted after checking that `projects` and `tasks`
  are arrays.
- Task due values are static labels (`Oggi`, `Domani`, etc.); there is no task
  creation flow or project editing/status/progress management.
- The global search filters projects and tasks; ideas have a separate search.
- The displayed date is hard-coded, and the dashboard activity chart is explicitly
  demonstrative rather than based on real activity.
- `README.md` is still the Vite starter template. The GitHub Pages workflow runs
  tests and a production build, but not lint.
- Baseline verification: 8 Vitest tests passed, `npm run lint` passed, and
  `npm run build` passed.

## Prioritized work

### P0 — Preserve and validate user data

- [x] Extract workspace types, defaults, and storage code into a small testable module.
- [x] Validate each persisted project, task, and idea before rendering it.
- [x] Retain valid records when sibling records are malformed; default optional and
  legacy fields without discarding valid workspace data.
- [x] Preserve the existing storage key and old records; avoid writing demo defaults
  over malformed or inaccessible storage.
- [x] Report read/write failures in the UI and cover legacy, corrupt, partial, and
  unavailable storage with tests.

Acceptance: valid legacy workspaces load unchanged; malformed records cannot crash
the app or silently replace usable records; storage errors are visible; targeted and
full tests pass. Completed in `fix: validate and preserve saved workspace data`;
all 16 tests, lint, and production build passed.

### P1 — Complete core project and task workflows

- [x] Project editing, status/progress changes, and confirmed deletion.
- [x] Task creation, real local-calendar due dates, priority, and filtering.
- [x] Keep task-to-project relationships valid when projects are deleted.
- [x] Ensure statistics and empty states derive from real records.

Acceptance: each change persists, destructive changes are confirmed, date behavior
is tested against local calendar dates, and task/project relationships remain valid.
Completed with task and project lifecycle controls, local-date conversion for legacy
`Oggi`/`Domani` records, overdue indicators, and status/project/priority filters.
All 22 tests, lint, and the production build pass.

### P1 — Improve navigation, dashboard, and accessibility

- [x] Make the date dynamic and localized.
- [x] Replace placeholder dashboard content with useful real-data summaries or label
  demonstrative content clearly.
- [x] Define global-search scope to include projects, tasks, and ideas.
- [x] Remove misleading placeholder controls and expose actionable errors.
- [x] Improve dialog keyboard/focus behavior, status announcements, and responsive
  search/form layout.

Acceptance: primary actions have real outcomes; navigation/search behavior and
keyboard-accessible dialogs are tested; mobile layout remains usable. The header
date and overdue summaries are now data-derived, and the demo chart is labeled as
illustrative. Dialogs now trap and restore focus; global search includes matching
ideas, and the search/form layout adapts to narrow screens.

### P2 — Local data portability

- [x] Export all workspace records as a versioned JSON file.
- [x] Validate imports before asking for confirmation and never replace existing data
  on an invalid file or cancelled import.

Acceptance: export includes every persisted entity and import replacement is
explicit, validated, and covered by tests. Completed in the local data-portability
increment; invalid files and cancelled imports leave the current workspace intact.

### P2 — Documentation and CI

- [x] Replace the starter README with accurate setup, usage, storage, limitations,
  tests, and GitHub Pages information.
- [x] Add lint to deployment checks if compatible with the existing workflow.
- [x] Keep the existing Pages base path and official artifact/deploy actions.
- [x] Verify GitHub Actions/deployment remotely when repository access allows it.

Acceptance: documented commands match `package.json`, all configured checks pass,
and the Pages workflow still builds the correct `/afterlight/` site. Local tests,
lint, and production build pass (28 tests). GitHub Actions run
[38154322240](https://github.com/alexmocci/afterlight/actions/runs/38154322240)
completed successfully for the published commit.

## Delivery notes

- Implement and verify one coherent increment before committing it.
- Do not include unrelated or generated files in commits.
- Push only ordinary commits to the existing branch; never force-push.
- Do not claim remote deployment success without checking the workflow run.
