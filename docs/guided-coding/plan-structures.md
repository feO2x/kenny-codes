---
sidebar_position: 8
title: Plan Structures
---

# Plan Structures

Every plan answers three questions: *why* are we doing this, *what* must be true when it's done, and *how* should a senior engineer - or a competent agent - approach it without guessing at your intent. The [Planning Phase](./planning-phase.mdx) explains why these three matter. This page is about the shape you give them.

There is no single right structure. The Guided Coding skills ship two, and you can bring your own. What they share is that a plan stays short and that each section carries information the others don't.

## The default structure

The default structure has exactly the three sections the questions above call for:

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

A Decision is only as good as the assumptions behind it. Before a Decision goes into the plan, its assumptions are checked against the code: claims made in the ticket, and the actual behavior of existing code the plan wants to reuse. When reading the code isn't enough, a temporary test or project shows what really happens. A simulation in the agent's head doesn't count as a check.

Sometimes an important assumption can't be verified during planning. Then the Decision says so, along with what follows if the assumption is wrong and what would resolve it. When a check disproves an assumption, the agent revises its own Decision. If the Decision was yours, it asks you first.

This is the same premise check the implementing skills run before they start - see the [Implementing Phase](./implementing-phase.mdx#when-the-plan-is-wrong). Catching a false premise while planning costs a sentence. Catching it during implementation costs a workaround or a follow-up plan.

### Each section adds information

RDAT states each fact once:

- **Acceptance Criteria** explain how to verify the Decisions: test inputs, expected results, and failure cases. Every Decision except the Out-of-Scope Decision has at least one criterion. Criteria never introduce behavior, contracts, or scope that no Decision mentions. Criteria that need a human - documentation quality, say, or platform behavior no feedback loop covers - state what is checked and who checks it.
- **Technical Details** contain only what an implementer who hasn't seen the planning conversation can't quickly find in the code: where a change goes when it isn't obvious, existing code to follow, interactions, pitfalls, and how to structure the tests. Nothing in this section adds a behavior, a contract, or an exclusion. If it does, it is a Decision.

General rules that already live in your `AGENTS.md` files are referenced, not copied. The history of how the agent investigated the problem stays out entirely.

The result reads differently from a plan with the default structure. The Decisions give you the whole picture, and the remaining sections answer "how do we know it works?" and "where do I start?" without repeating it.

## Notes for the Guided Learning Teacher

When a plan will be implemented with [Guided Learning](./guided-learning-getting-started.mdx), RDAT allows one more section after the four: `## Notes for the Guided Learning Teacher`. It lists topics worth teaching along the way that the plan itself doesn't need, such as SOLID, TDD, or the internals of a technology the plan touches. The teaching skills pick these topics up in the Implementing Phase.

The section is optional. `guided-coding-write-plan` adds it only when the planning conversation says the plan will be taught, so mention it while you discuss the approach.

## Choosing a structure

You can choose a structure for a single plan, for a whole repository, or write your own:

- **For one plan**, name the structure when you invoke `/guided-coding-write-plan` or `/guided-coding-plan-and-review`, for example `/guided-coding-write-plan rdat-plan-structure.md`. A bare filename refers to a structure bundled with the skill. Any other path is resolved from the repository root.
- **For a repository**, name it in `ai-plans/AGENTS.md`, for example: ``Use the RDAT plan structure (`rdat-plan-structure.md`).``
- **Your own structure** can live in a Markdown file that you name in either of these ways. You can also describe it directly in `ai-plans/AGENTS.md`.

A structure named at invocation wins over `ai-plans/AGENTS.md`, which wins over the default. If a named file doesn't exist, the skill stops and tells you instead of falling back to another structure, so you never end up with a plan in a structure you didn't choose.

:::tip[The Opinionated Path]
I use RDAT for every plan. The line ``Use the RDAT plan structure (`rdat-plan-structure.md`).`` sits in the `ai-plans/AGENTS.md` of each of my repositories, so I never have to name it when I invoke a skill. `/guided-coding-setup` doesn't add it for you - [Getting Started](./guided-coding-getting-started.mdx#step-0-set-up-the-repository) shows where it goes.

The Decisions section changed how I review plans. I read it first and ask myself whether I would approve it as it stands. Only then do I check whether the criteria really verify each Decision.
:::
