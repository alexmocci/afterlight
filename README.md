# Afterlight

Afterlight is a personal workspace for organizing projects, tasks, and ideas. It
runs in the browser and keeps the workspace on the device, with JSON backup and
restore.

## Features

- Track projects by status and progress; create, edit, and remove projects.
- Create and manage tasks with due dates, priorities, completion status, and
  project filters.
- Save, search, edit, and remove ideas.
- Search projects, tasks, and ideas from the global search.
- Review overdue tasks and workspace summaries.
- Export a versioned JSON backup and validate an import before replacing data.
- Use the mobile navigation drawer and responsive project, task, and idea views
  on narrow screens.

## Requirements

- Node.js 22 or newer
- npm

## Development

```sh
npm ci
npm run dev
```

The development server prints its local URL when it is ready.

## Checks

```sh
npm test -- --run
npm run lint
npm run build
```

`npm run build` runs the TypeScript project checks and creates the production
site in `dist/`.

## Data and privacy

The workspace is stored in browser `localStorage` under
`afterlight-workspace-v1`. It is not synchronized to a server. Clearing browser
storage or using another browser/device can remove or hide the workspace, so
export a JSON backup regularly. Imports are validated locally and replace the
current workspace only after explicit confirmation. When malformed saved data
is repaired after a user edit, Afterlight preserves the original in a separate
local recovery entry first.

## Deployment

The `main` branch is deployed to GitHub Pages by
[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml). The Vite
configuration uses `/afterlight/` as its base path for the project site.
