# Root AGENTS.md

This is Kenny Pflug's website where he blogs, announces talks and workshops, and teaches about AI, Cloud-Native and .NET.

## General Rules

- Never run the dev server. Assume it is already running.
- When you create git commit, always sign off and use Conventional Commits messages. Decide whether a message body is required.

## Feedback loops

- `npm run typecheck` - runs `tsc` over the TypeScript sources (site components, Docusaurus config,
  and the scripts in `scripts/`). Verified to pass in this repository.
- `npm run build` - regenerates `src/data/home-data.json` and the social cards under
  `static/img/social-cards/`, then runs the full Docusaurus production build, which also catches
  broken links and MDX errors. Note that it writes into tracked files, so run it deliberately and
  review the resulting diff.

There is no test runner, linter, or security scanner configured in this repository. The GitHub
Actions workflows in `.github/workflows/` run only `npm ci` and `npm run build` (`build.yml`, reused by
`pull-request.yml` for PRs to `main` and by `deploy.yml`, which also deploys to GitHub Pages).

`deploy.yml` also publishes a preview of every open PR from this repository at `/pr/<number>/` and
links it in a PR comment. Previews are built with `BASE_URL=/pr/<number>/`, which
`docusaurus.config.ts` uses as `baseUrl` and which also marks the pages `noindex`. Previews leave
out the social cards and the slide PDFs. Root-absolute paths must therefore go through Docusaurus
(`<Link>`, `useBaseUrl`, Markdown links), never hardcoded `href="/..."` strings, or they break in
previews. To check a change locally, run
`BASE_URL=/pr/1/ npx docusaurus build --out-dir <scratch dir>` after `npm run build`.

## How to write plans

See [ai-plans/AGENTS.md](ai-plans/AGENTS.md) on how to handle plans and plan deviation documents in the ai-plans folder.

## This is your space

If you find something noteworthy while you work with this codebase, feel free to add it here. I will discuss your points afterwards and we'll see if they become additional rules for agents.
