# DOX framework

- DOX is highly performant AGENTS.md hierarchy installed here
- Agent must follow DOX instructions across any edits

## Core Contract

- AGENTS.md files are binding work contracts for their subtrees
- Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable AGENTS.md plus every parent AGENTS.md above it

## Read Before Editing

1. Read the root AGENTS.md
2. Identify every file or folder you expect to touch
3. Walk from the repository root to each target path
4. Read every AGENTS.md found along each route
5. If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there
6. Use the nearest AGENTS.md as the local contract and parent docs for repo-wide rules
7. If docs conflict, the closer doc controls local work details, but no child doc may weaken DOX

Do not rely on memory. Re-read the applicable DOX chain in the current session before editing.

## Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning AGENTS.md when a change affects:

- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or quality
- AGENTS.md creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child index changes. Update child docs when parent changes alter local rules. Remove stale or contradictory text immediately. Small edits that do not change behavior or contracts may leave docs unchanged, but the DOX pass still must happen.

## Hierarchy

- Root AGENTS.md is the DOX rail: project-wide instructions, global preferences, durable workflow rules, and the top-level Child DOX Index
- Child AGENTS.md files own domain-specific instructions and their own Child DOX Index
- Each parent explains what its direct children cover and what stays owned by the parent
- The closer a doc is to the work, the more specific and practical it must be

## Child Doc Shape

- Create a child AGENTS.md when a folder becomes a durable boundary with its own purpose, rules, responsibilities, workflow, materials, or quality standards
- Work Guidance must reflect the current standards of the project or user instructions; if there are no specific standards or instructions yet, leave it empty
- Verification must reflect an existing check; if no verification framework exists yet, leave it empty and update it when one exists

Default section order:
- Purpose
- Ownership
- Local Contracts
- Work Guidance
- Verification
- Child DOX Index

## Style

- Keep docs concise, current, and operational
- Document stable contracts, not diary entries
- Put broad rules in parent docs and concrete details in child docs
- Prefer direct bullets with explicit names
- Do not duplicate rules across many files unless each scope needs a local version
- Delete stale notes instead of explaining history
- Trim obvious statements, repeated rules, misplaced detail, and warnings for risks that no longer exist

## Closeout

1. Re-check changed paths against the DOX chain
2. Update nearest owning docs and any affected parents or children
3. Refresh every affected Child DOX Index
4. Remove stale or contradictory text
5. Run existing verification when relevant
6. Report any docs intentionally left unchanged and why

## Project Scope and Ownership

- This repository is Tinvest-AI (Thunderfam Investment), a React/Vite web application. Preserve its existing product identity.
- `src/App.jsx` owns UI, root state, localStorage/Supabase loading and persistence.
- `src/reportCalculations.js` owns report totals and capital reconciliation.
- `src/reportCalculations.test.mjs` owns financial regression tests.
- `package.json` owns development, verification, and build commands.
- This root document owns all repository rules until child DOX documents are introduced.

## Financial Contract

- For each investor, every report after the first must satisfy: openingInvestment = calcReport(previousReport).newInvestment.
- New Investment equals Opening Capital plus net profit. Net profit deducts invested amounts, activity expenses, and additional expenses from revenue.
- Reconcile all subsequent reports after any financial edit and when loading existing data, including closed reports. Preserve each investor's first opening capital.
- Reconciliation must happen before rendering and persistence through the root `setData` wrapper; never bypass it with direct raw-state updates.
- The stored reports array defines period order for each investor. Reports are appended in order; editable labels and activity dates are not reliable month keys. Any future backdated insertion/reordering feature must define explicit period ordering first.
- Keep investors isolated. Do not mutate the previous state or alter activities while reconciling capital.

## Report Title Editing

- Users with `create_report` permission can rename report tabs by double-clicking the title or pressing F2 on the focused tab, including closed reports.
- Enter or the green check button saves the trimmed, nonempty title through root `setData` and records an audit entry. Escape cancels; selecting another tab discards the draft.
- Renaming preserves report IDs, period order, investor ownership, and financial data; it does not change capital calculations.

## Report Interactions

- Double-clicking a noninteractive activity cell starts the existing inline editor when editing is permitted and the report is open. Enter in Date, Description, Invested, Revenue, or Expenses saves through the same handler as the green check; IME composition does not submit.
- Activity rows use the same subtle gray background for hover and click selection, scoped to report/activity IDs. Keyboard Enter/Space also selects; reduced-motion preferences disable the transition.
- Report tabs stay on one horizontally scrollable row and do not shrink. Hover uses the same accent color, background, bold text, and left border as selection.
- `src/reportTitles.js` translates fully recognized French/English month and report titles at display time. Unknown wording retains the complete original title. Editing always uses the original stored text.
- `src/reportInteractions.css` owns scoped row and report-tab styles.

## User Preferences and Work Guidance

- Read the applicable DOX chain before editing; update it after behavior or workflow changes.
- Check available skills and tooling before work and use relevant installed engineering skills.
- Commit changes and push to GitHub `main` after requested modifications and applicable verification.
- Do not commit secrets, local environment files, runtime financial data, dependencies, or generated artifacts.
- Use drive `D:` for source workspaces, dependency caches, builds, and temporary artifacts on this workstation.

## Verification

- `npm test`: title translation/fallback tests and financial regression tests, including June/July repair, propagation through following reports, investor isolation, and zero/negative balances.
- `npm run build`: Vite production build; install locked dependencies with `npm ci` when needed. Report a blocked build honestly.
- `npm run lint`: repository ESLint check; distinguish existing violations from changes introduced by the task.
- `git diff --check`: whitespace validation before committing.

## Child DOX Index

- No child AGENTS.md files currently exist. This document owns `src/`, root configuration, and maintained documentation.
