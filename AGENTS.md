# Root AGENTS.md

This is Kenny Pflug's website where he blogs, announces talks and workshops, and teaches about AI, Cloud-Native and .NET.

## General Rules

- Never run the dev server. Assume it is already running.
- When you create git commit, always use Conventional Commits messages 

## When you implement a plan

Plans in `ai-plans/` are frozen once their Planning Phase ends. The only edit you may make to a plan
is flipping an acceptance criterion from `- [ ]` to `- [x]`.

- Check a criterion only after the implementation exists and the relevant feedback loops verify it.
- Leave unmet criteria unchecked, and never change the wording of a criterion.
- When the implementation materially departs from an explicit decision in the plan, write a Plan
  Deviations document instead of editing the frozen plan.

## Feedback loops

- `npm run typecheck` — runs `tsc` over the TypeScript sources (site components, Docusaurus config,
  and the scripts in `scripts/`). Verified to pass in this repository.
- `npm run build` — regenerates `src/data/home-data.json` and the social cards under
  `static/img/social-cards/`, then runs the full Docusaurus production build, which also catches
  broken links and MDX errors. Note that it writes into tracked files, so run it deliberately and
  review the resulting diff.

There is no test runner, linter, or security scanner configured in this repository. The GitHub
Actions workflow `.github/workflows/deploy-docusaurus.yml` runs only `npm ci` and `npm run build`.

## How to write plans

See ai-plans/AGENTS.md for details on how to write plans.

## This is your space

If you find something noteworthy while you work with the codebase, feel free to add it here. I will discuss with you whether this will become an additional rule in AGENTS.md.
