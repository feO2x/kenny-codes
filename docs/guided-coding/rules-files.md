---
sidebar_position: 7
title: What Belongs in a Rules File
---

# What Belongs in a Rules File

## Every line should earn its place

Rules files such as `AGENTS.md` consume context on every task to which they apply. A [2026 study of repository-level context files](https://arxiv.org/abs/2602.11988) found no significant improvement in task success, while inference cost increased by more than 20% on average. The useful nuance is that agents generally followed the instructions they were given, but repository overviews did not help them find the relevant code faster.

The lesson is not that rules files are useless. It is that they should contain information an agent cannot reliably discover — or should not have to rediscover — from the repository itself:

- **Workflow invariants** that exist because your team decided on them, such as freezing a plan when its Planning Phase ends. See [The Plan Record](./plan-record.md).
- **Feedback loops**, by exact command and what each one verifies. These give the agent the supervision it needs during the [Implementing Phase](./implementing-phase.mdx).
- **Empirical rules** that prevent mistakes your agents have actually repeated in this codebase.

Avoid duplicating the README, listing the directory tree, explaining standard language conventions, or documenting facts that are obvious from code files. The agent can inspect those when the task requires them. Permanent context should be reserved for the parts it would otherwise get wrong.

## Let repeated experience create the rules

Do not turn every disappointing agent response into a permanent instruction. A one-off mistake might come from an unclear prompt, missing context, or a model behavior that disappears with the next release.

Add a rule when you see the **same avoidable error across multiple tasks**. For example, Opus 4.6 repeatedly generated nested test classes in one of my .NET codebases. I do not want that structure, and nothing in the compiler or test runner rejects it, so a short rule earned its place:

> Do not use nested test classes. Keep test classes at namespace scope.

This is empirical knowledge: a specific response to observed behavior, not a generic attempt to predict everything an agent might do wrong. Keep the rule focused on the desired outcome and let the codebase provide the surrounding context.

Revisit these rules after changing models, agent harnesses, or project conventions. If the mistake no longer occurs, remove the rule.

## Keep the scope narrow

Put only repository-wide instructions in the root rules file. When your agent supports scoped or nested rules files, keep specialized guidance next to the files it governs:

- `src/AGENTS.md` for production-code conventions;
- `tests/AGENTS.md` for testing conventions; and
- `ai-plans/AGENTS.md` for the plans.

This keeps a planning conversation from paying for test-layout rules and keeps a documentation change from loading production-code details. Check how your agent discovers nested instructions before relying on this structure; clients do not all implement scoping in exactly the same way.

## Treat agent notes as proposals

I keep a `## This is your space` section where an agent can record something unusual it discovers in the repository. This is an observation buffer, not an invitation to create permanent policy.

Review those notes after the task. Promote a note into a rule only when later experience confirms it, move durable knowledge to the documentation where it belongs, and delete the rest. Otherwise the section slowly becomes the oversized context file this page is warning against.

:::tip[The Opinionated Path]
`/guided-coding-setup` creates or updates four small pieces of root guidance: how frozen plans are treated during implementation, the repository's confirmed feedback-loop commands, a link to the plan-writing instructions, and "This is your space".

The skill discovers candidate commands from build manifests, task runners, scripts, and CI configuration. It runs commands only when they are safe and reasonably bounded, reports which ones it could not run, and never pretends an unconfirmed feedback loop passed. It also creates the scoped `ai-plans/AGENTS.md` and preserves project-specific instructions when run again after an upgrade.
:::

## A small top-level example

The following example is deliberately generic. Replace the project description, feedback-loop commands, and empirical rule with facts you have verified in your own repository.

```md
# Repository Instructions

This repository contains a high-performance .NET library. Runtime performance takes priority over extensibility.

## General rules

- Do not use nested test classes. Keep test classes at namespace scope.

## When you implement a plan

Plans in `ai-plans/` are frozen once their Planning Phase ends. The only edit you may make
to a plan is flipping an acceptance criterion from `- [ ]` to `- [x]`.

- Check a criterion only after the implementation exists and the relevant feedback loops verify it.
- Leave unmet criteria unchecked, and never change the wording of a criterion.
- Record material departures in a Plan Deviations document instead of editing the frozen plan.

## Feedback loops

- `dotnet test` — builds the solution and runs all automated tests.
- `dotnet format --verify-no-changes` — verifies formatting and analyzer rules.

## Scoped instructions

- Read `src/AGENTS.md` for production-code conventions.
- Read `tests/AGENTS.md` for testing conventions.
- Read `ai-plans/AGENTS.md` before writing plans.

## This is your space

Record noteworthy repository discoveries here for discussion after the task.
```

For a larger real-world example, see the rules files in [Light.PortableResults](https://github.com/feO2x/Light.PortableResults). Treat them as evidence of one project's accumulated experience, not as a template to copy unchanged.
