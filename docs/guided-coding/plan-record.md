---
sidebar_position: 6
title: The Plan Record
---

# The Plan Record

The three phases describe how you work on one change. This page describes what those changes leave behind: a directory of plans that, read in order, explains how the codebase came to look the way it does.

## Append-only by design

The natural instinct with a plan is to keep it up to date. Something changes during implementation, so you go back and edit the plan to match. After a few rounds, the plan describes the code — which the code already did, for free.

Guided Coding does the opposite. A plan is **an event, not a state**. It records a decision made at a point in time, by you and the agent, with the information you had then. It is never rewritten to match reality. If reality diverges, you append another document saying so.

This is the same idea as Event Sourcing: you don't overwrite the current value, you append the change that produced it. The current state of the codebase is in the codebase. What the codebase cannot tell you is *why* — why this abstraction and not that one, why this trade-off, why the obvious approach was rejected. That is what the record holds.

Concretely, the directory answers questions that git history alone answers badly:

- Why does this component exist in this shape?
- Was this design considered and rejected, or never considered at all?
- What did we intend here, and where did the implementation end up going differently?

## Freezing a plan

**A plan freezes when its Planning Phase ends** — in practice, when you commit it.

From that moment, exactly one edit is permitted: ticking an acceptance criterion from `- [ ]` to `- [x]`. And even that comes with conditions:

- Tick a criterion only after the implementation exists *and* the relevant feedback loops verify it.
- Leave unmet criteria unchecked. An unmet criterion is information; hiding it is not.
- Never reword, add, remove, or reorder criteria in a frozen plan.

Everything else — new decisions, corrected decisions, abandoned decisions — is appended as a new document.

The freeze rule does real work. It makes an unmet acceptance criterion impossible to quietly redefine into a met one, which is exactly the failure mode you get when a plan is editable and the deadline is close. It also means the plan you review at the end is the plan you agreed to at the start.

## Follow-up plans

When the Guiding Phase turns up something large — a wrong data structure, a misused framework mechanism, a design that won't extend — you go back to the Planning Phase and write a **follow-up plan**.

A follow-up plan is a normal plan with the same structure and the same issue identifier, written later. What makes it a follow-up is what it says:

- It **names the earlier plans by exact filename** in its Rationale.
- It states **exactly which earlier decisions it supersedes, and why**.
- It records only what changed. It does not repeat decisions that still hold, and it never contradicts an earlier plan silently.

That last point is the one to watch. A follow-up plan that quietly disagrees with its predecessor leaves a reader with two documents and no way to tell which one won.

Splitting a plan that turned out too large is the most common reason to write one. See [Finding the Right Plan Size](./finding-the-right-plan-size.md).

## Plan Deviations documents

Follow-up plans capture decisions you changed *before* implementing. A **Plan Deviations document** captures the gap between what the plans decided and what the finished code actually does.

You write one at the end of a cycle, when the implementation materially changed or rejected an explicit decision about:

- an acceptance outcome;
- a public contract or data model;
- an architectural or component boundary;
- a security or performance constraint; or
- anything else a future maintainer would need in order to understand the design.

You do **not** write one for routine implementation choices the plan deliberately left open. If the plan didn't decide it, the implementation didn't deviate from it. A document listing every small difference is worse than no document, because it buries the two entries that mattered.

One thing a Plan Deviations document cannot do: resolve an unmet acceptance criterion. Documenting that a criterion wasn't met does not make it met. It stays unchecked unless an accepted follow-up plan explicitly supersedes it.

A good deviation entry answers four questions:

- **Original plan** — what was specified.
- **Implemented** — what the code actually does.
- **Why** — what caused the change. Never omit this; it is the entire point of the document.
- **Impact** — trade-offs, consequences, deferred work.

Like plans, these documents freeze once committed.

## The reviewer contract

Here is the practical payoff, and the reason the deviations document is worth writing.

A pull request produced this way comes with a promise: **a reviewer needs to read the issue's first plan and the Plan Deviations document, and they have the whole picture.** The plan tells them what was intended and why. The deviations document tells them where the result differs and why that was right.

Without that pair, a reviewer facing a few thousand lines of diff has to reverse-engineer intent from code. With it, they can spend their attention on judging decisions instead of reconstructing them.

## In the repository

The record lives in `ai-plans/` alongside an `AGENTS.md` that tells agents how to write into it. Keeping the instructions next to the documents means every agent that touches a plan reads the rules first, without those rules taking up space in your root instruction file.

:::tip[The Opinionated Path]
### Filenames

```text
YYYY-MM-DD-HHMM-<issue-id>-<kebab-case-description>.md
YYYY-MM-DD-HHMM-<issue-id>-plan-deviations.md
```

The timestamp is **UTC**, taken from the shell at the moment of writing — never inferred from the conversation, because agents are unreliable about the current time. Omit the `<issue-id>` segment when the work has no tracker issue.

```text
2026-08-13-1420-42-cancelled-events.md
2026-08-13-1655-42-cancelled-events-serialization.md
2026-08-14-0930-42-plan-deviations.md
```

Version 1 numbered files by issue and sequence (`0015-0-feature.md`). The timestamp prefix replaced it so the directory sorts chronologically no matter how the tracker numbers things, and so two documents for the same issue can never collide. **Don't rename historical documents** to match the new format — they are frozen too, and a decision record that gets retroactively tidied isn't one.

### Guardrails

The skills refuse to overwrite or reuse an existing plan or Plan Deviations filename; a collision stops the run and gets reported. Plans and deviations are committed with path-limited commits, so a plan commit contains the plan and nothing else.

### Skills

- `/guided-coding-setup` creates `ai-plans/` and writes its `AGENTS.md`. Run it again to upgrade; it preserves your project-specific additions and never touches existing plans.
- `/guided-coding-write-plan` handles both first plans and follow-up plans, reading every earlier document for the issue before writing.
- `/guided-coding-write-deviations` first decides whether a document is warranted at all, and reports "no material deviations" rather than inventing entries. When a PR exists, it offers to publish the accepted document as the description.

See the [Quick Start](./quick-start.mdx) for the full sequence.
:::
