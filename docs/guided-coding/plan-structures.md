---
sidebar_position: 8
title: Plan Structures
image: /img/social-cards/docs-guided-coding-plan-structures.jpg
---

# Plan Structures

Every plan explains *why* the work is needed, *what* the result must satisfy, and *how* to approach the implementation. The [Planning Phase](./planning-phase.mdx) explains why these matter. This page describes how to organize them.

There is no single right structure. The Guided Coding skills ship two, and you can bring your own. What they share is that a plan stays short and that each section carries information the others don't.

## The default structure

The default structure organizes the why, what, and how into three sections:

1. **Rationale** - the problem and the goal of this work.
2. **Acceptance Criteria** - observable, verifiable outcomes as unchecked Markdown tasks (`- [ ]`). They describe results, not implementation steps.
3. **Technical Details** - the guidance an implementer needs: APIs to extend, patterns to follow, testing and benchmark guidance, and performance, threading, or security constraints.

It is a good fit for small plans and for getting started. As plans grow, you may notice that the important choices are scattered: one hides in a criterion, another in a paragraph of Technical Details. When you review the plan, you have to collect them yourself before you can say "yes, build this". That is the gap RDAT closes.

## RDAT

RDAT stands for **Rationale, Decisions, Acceptance Criteria, and Technical Details**. It adds one section between the rationale and the criteria.

### Why Decisions exist

A reviewer who reads only the Decisions section should know what will be built and why, and be able to approve the plan. That makes it the part of the plan you read most carefully, and the part a colleague can skim when they only need the gist.

A choice becomes a Decision when picking the alternative would affect behavior, public contracts, scope, or dependencies. Each Decision states the choice itself, not a list of options for the implementer, and gives a one-sentence reason when the choice isn't obvious. Routine implementation choices stay out, and so does everything that stays unchanged. A plan uses as few Decisions as it needs.

### Decision IDs

Each Decision gets an ID: `D1`, `D2`, and so on. The IDs stay stable while you revise the draft, so you can talk about "D4" during the discussion without the number shifting under you.

They pay off well beyond the Planning Phase. Acceptance criteria and Technical Details refer to Decisions by ID instead of repeating them. When an implementing agent finds that a plan decision is wrong, it reports the problem as `<plan-file-name> D3`. Reviewers, follow-up plans, and Plan Deviations documents can all point at the exact decision they mean.

### The Out-of-Scope Decision

The last Decision may list what the ticket or the discussion mentioned and the plan deliberately leaves out. It answers the question every reviewer eventually asks - "what about X?" - before they have to ask it. It only lists things that actually came up. Invented exclusions add noise without telling anyone anything.

### Checking assumptions against the code

Before recording a Decision, check its assumptions against the code. This includes relevant claims in the ticket and the behavior of existing code the plan will reuse. When reading the code isn't enough, use a temporary test or project to check the behavior. Reasoning alone does not verify it.

Sometimes an important assumption can't be verified during planning. Then the Decision says so, along with what follows if the assumption is wrong and what would resolve it. When a check disproves an assumption, the agent revises its own Decision. If the Decision was yours, it asks you first.

The implementing skills check these assumptions again before they start. See the [Implementing Phase](./implementing-phase.mdx#when-the-plan-is-wrong). During planning, you can correct an assumption by revising the draft. Discovering the same error during implementation may require a workaround or a follow-up plan.

### Each section adds information

RDAT states each fact once:

- **Acceptance Criteria** explain how to verify the Decisions: test inputs, expected results, and failure cases. Every Decision except the Out-of-Scope Decision has at least one criterion. Criteria never introduce behavior, contracts, or scope that no Decision mentions. Criteria that need a human - documentation quality, say, or platform behavior no feedback loop covers - state what is checked and who checks it.
- **Technical Details** provide guidance that is difficult to discover from the code alone. Assume the implementer has not seen the planning conversation. Include relevant locations, existing code to follow, interactions, pitfalls, and guidance on structuring tests. New behavior, contracts, or exclusions belong in Decisions.

General rules that already live in your `AGENTS.md` files are referenced, not copied. The history of how the agent investigated the problem stays out entirely.

The result reads differently from a plan with the default structure. The Decisions give you the whole picture, and the remaining sections answer "how do we know it works?" and "where do I start?" without repeating it.

## Notes for the Guided Learning Teacher

When a plan will be implemented with [Guided Learning](./guided-learning-getting-started.mdx), RDAT allows one more section after the four: `## Notes for the Guided Learning Teacher`. It lists topics worth teaching along the way that the plan itself doesn't need, such as SOLID, TDD, or the internals of a technology the plan touches. The teaching skills pick these topics up in the Implementing Phase.

The section is optional. `guided-coding-write-plan` adds it only when the planning conversation says the plan will be taught, so mention it while you discuss the approach.

## Choosing a structure

You can choose a structure for a single plan, for a whole repository, or write your own:

- **For one plan**, name the structure when you run `/guided-coding-write-plan` or `/guided-coding-plan-and-review`, for example `/guided-coding-write-plan rdat-plan-structure.md`. A bare filename refers to a structure bundled with the skill. Any other path is resolved from the repository root.
- **For a repository**, name it in `ai-plans/AGENTS.md`, for example: ``Use the RDAT plan structure (`rdat-plan-structure.md`).``
- **Your own structure** can live in a Markdown file that you name in either of these ways. You can also describe it directly in `ai-plans/AGENTS.md`.

A structure named in your command takes precedence over `ai-plans/AGENTS.md`, which takes precedence over the default. If a named file doesn't exist, the skill stops and reports it.

:::tip[The Opinionated Path]
I use RDAT for every plan. The line ``Use the RDAT plan structure (`rdat-plan-structure.md`).`` sits in the `ai-plans/AGENTS.md` of each of my repositories, so I never have to name it when I run a skill. `/guided-coding-setup` doesn't add it for you - [Getting Started](./guided-coding-getting-started.mdx#step-0-set-up-the-repository) shows where it goes.

The Decisions section changed how I review plans. I read it first and ask myself whether I would approve it as it stands. Only then do I check whether the criteria really verify each Decision.
:::
