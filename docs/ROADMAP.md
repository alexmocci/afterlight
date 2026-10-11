# Afterlight roadmap

This roadmap reflects the repository audit performed on 11 October 2026. Work is
planned as small, verifiable increments; priorities may change if implementation
reveals data-compatibility or deployment risks.

## Current audit baseline

- The app is a React/TypeScript single-page workspace with projects, tasks, ideas,
  dashboard summaries, global and idea search, filters, and CRUD flows.
- Workspace data remains local in `afterlight-workspace-v1`; imports and exports
  use a versioned JSON envelope, and malformed saved data is backed up before
  normalization is persisted.
- Project status/progress, task due dates and priorities, completed/overdue
  states, and local-calendar date handling are implemented.
- `README.md` documents development, privacy, data backups, checks, and Pages.
  GitHub Actions runs tests, lint, and the production build.
- The new responsive audit found that the old horizontally scrolling mobile nav
  expanded the document to 593 px on a 320–430 px viewport. Desktop layouts were
  already using responsive grids, but touch navigation and compact project/task
  rows needed a dedicated small-screen treatment.
- Before this responsive increment: 28 Vitest tests passed; lint and production
  build passed.

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

### P1 — Responsive layout and mobile navigation

- [x] Remove the mobile navigation's min-content overflow and prevent the page
  from exceeding the narrow viewport.
- [x] Replace the clipped horizontal navigation with an accessible mobile drawer
  that closes on section selection, Escape, or tapping outside.
- [x] Keep project/task/idea actions and forms usable at compact widths, and keep
  statistics, filters, and dialogs within the viewport.
- [x] Apply dynamic viewport and safe-area sizing, and prevent iOS input zoom with
  readable input text sizing.
- [x] Validate all six sections across the eight requested viewport sizes and
  exercise navigation, task creation, modal bounds, and persistence.

Acceptance: no horizontal overflow in any tested section/viewport pair; keyboard,
touch, modal, and persistence flows remain usable. Browser validation covered all
48 combinations:

| Viewport | Mobile drawer | Statistic columns | Horizontal overflow |
| --- | --- | ---: | --- |
| 320 × 700 | Yes | 2 | None |
| 375 × 812 | Yes | 2 | None |
| 390 × 844 | Yes | 2 | None |
| 430 × 932 | Yes | 2 | None |
| 768 × 1024 | No (tablet sidebar) | 2 | None |
| 1024 × 768 | No (tablet sidebar) | 2 | None |
| 1366 × 768 | No (desktop sidebar) | 4 | None |
| 1920 × 1080 | No (desktop sidebar) | 4 | None |

At 320 × 700 the project dialog remained entirely inside the viewport. The mobile
Drawer was checked for focus trapping/restoration, Escape, outside click, section
selection, and resizing from mobile to desktop and back; task creation persisted
after a page reload. These checks ran in the integrated Chromium browser.
Physical iOS Safari was not available, so its safe-area and virtual-keyboard
behavior still needs device verification.

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
