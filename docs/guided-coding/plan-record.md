---
sidebar_position: 7
title: The Plan Record
---

# The Plan Record

The three phases describe how you work on a change. The plans you keep explain how and why the codebase changed over time.

## Append-only by design

Updating a plan to match the implementation erases the original decisions and the reasons they changed.

In Guided Coding, a frozen plan records the decisions you and the agent made with the information available at the time. If those decisions change, you add a new document explaining what changed and why.

This is similar to Event Sourcing: you preserve earlier events and record each change as a new event. The code shows the current implementation. The plans explain why you chose an abstraction, accepted a trade-off, or rejected an alternative.

Concretely, the directory answers questions that git history alone answers badly:

- Why does this component exist in this shape?
- Was this design considered and rejected, or never considered at all?
- What did we intend here, and where did the implementation end up going differently?

## Freezing a plan

**A plan freezes when its Planning Phase ends** - in practice, right before you commit it.

From that moment, exactly one edit is permitted: ticking an acceptance criterion from `- [ ]` to `- [x]`. And even that comes with conditions:

- Tick a criterion only after the implementation exists *and* the relevant feedback loops verify it.
- Leave unmet criteria unchecked. An unmet criterion is information; hiding it is not.
- A criterion met only through a workaround also stays unchecked until a reviewer accepts the workaround. The reviewer may then check it off. See [Workarounds and Reported Problems](./guiding-phase.mdx#workarounds-and-reported-problems).
- Never reword, add, remove, or reorder criteria in a frozen plan.

Everything else - new decisions, corrected decisions, abandoned decisions - is appended as a new document.

The freeze rule does real work. It makes an unmet acceptance criterion impossible to quietly redefine into a met one, which is exactly the failure mode you get when a plan is editable and the deadline is close. It also means the plan you review at the end is the plan you agreed to at the start.

## Follow-up plans

When the Guiding Phase turns up something large - a wrong data structure, a misused framework mechanism, a design that won't extend - you go back to the Planning Phase and write a **follow-up plan**.

A follow-up plan is a normal plan with the same structure and the same issue identifier, written later. What makes it a follow-up is what it says:

- It **names the earlier plans by exact filename** in its Rationale.
- It states **exactly which earlier decisions it supersedes, and why**.
- It records only what changed. It does not repeat decisions that still hold, and it never contradicts an earlier plan silently.

That last point is the one to watch. A follow-up plan that quietly disagrees with its predecessor leaves a reader with two documents and no way to tell which one won.

Splitting a plan that turned out too large is the most common reason to write one. See [Finding the Right Plan Size](./finding-the-right-plan-size.md).

## Plan Deviations documents

Follow-up plans capture decisions you changed *before* implementing. A **Plan Deviations document** closes the record for the reviewer. It serves two related purposes:

- When follow-up plans exist, it summarizes how they changed the first plan and what the final implementation does. In this case, you **always** write one - even when the code follows every accepted plan exactly.
- With a single plan, it records any material gap between what that plan decided and what the finished code actually does.

An implementation deviation is material when it changes or rejects an explicit decision about:

- an acceptance outcome;
- a public contract or data model;
- an architectural or component boundary;
- a security or performance constraint; or
- anything else a future maintainer would need in order to understand the design.

With a single plan and no material deviations, you do not create a document merely to say that everything matched. You also do **not** add entries for routine implementation choices the plans deliberately left open. If the record didn't decide it, the implementation didn't deviate from it. A document listing every small difference is worse than no document, because it buries the two entries that mattered.

One thing a Plan Deviations document cannot do: resolve an unmet acceptance criterion. Documenting that a criterion wasn't met does not make it met. It stays unchecked unless an accepted follow-up plan explicitly supersedes it.

A good follow-up summary identifies the original decision, the exact follow-up plan that superseded it, why it changed, and the final outcome. A good implementation-deviation entry answers four questions:

- **Plan decision** - the exact plan filename and what it specified.
- **Implemented** - what the code actually does.
- **Why** - what caused the change. Never omit this; it is the entire point of the document.
- **Impact** - trade-offs, consequences, deferred work.

A work item has **at most one** Plan Deviations document. Its lifecycle is:

- It stays editable until it is merged into the target branch.
- If a pull request review leads to another follow-up plan, update the document after implementing that plan.
- With each update, rewrite the whole document and give it a new timestamp. Its filename must sort after all plans for the work item.

Once merged, it is frozen like everything else in the record. If you ever need to redo a merged document, delete it and write it again from scratch.

## The reviewer contract

A reviewer should be able to understand the intent and decisions behind a change by reading **the issue's first plan and, when one exists, the Plan Deviations document**. The first plan explains the original intent. The deviations document summarizes every follow-up plan and every material implementation deviation. If the implementation matches a single plan, that plan is enough.

Without that pair, a reviewer facing a few thousand lines of diff has to reverse-engineer intent from code. With it, they can spend their attention on judging decisions instead of reconstructing them.

## In the repository

The record lives in `ai-plans/` alongside an `AGENTS.md` that tells agents how to write into it: the filename conventions, the rules for frozen plans, and the rules for the Plan Deviations document. It is also the place for repository-wide choices about plans, such as the [plan structure](./plan-structures.md#choosing-a-structure) you use or the configuration for [automated plan review](./automated-plan-review.mdx#configuration).

Keeping the instructions next to the documents means they don't take up space in your root instruction file. Agents that don't read nested instruction files on their own find them through a short `## Guided Coding` section in the root `AGENTS.md` that only links to `ai-plans/AGENTS.md` - see the [Implementing Phase](./implementing-phase.mdx#the-plan-stays-frozen) for why that link matters.

:::tip[The Opinionated Path]
### Filenames

```text
YYYY-MM-DD-HHMM-<ticket-id>-<short-title>.md
YYYY-MM-DD-HHMM-<ticket-id>-plan-deviations.md
```

Before it freezes, a draft is simply `<short-title>.md`. The timestamp is **UTC**, taken from the shell at the moment of freezing - never inferred from the conversation, because agents are unreliable about the current time. A frozen plan also carries a `*Frozen at ...*` line below its title. Omit the `<ticket-id>` segment when the work has no ticket.

```text
2026-08-13-1420-42-cancelled-events.md
2026-08-13-1655-42-cancelled-events-serialization.md
2026-08-14-0930-42-plan-deviations.md
```

When the Plan Deviations document is updated, it gets a new timestamp, for example `2026-08-15-1105-42-plan-deviations.md`, so it still sorts after the newest plan.

Version 1 numbered files by issue and sequence (`0015-0-feature.md`). Timestamp prefixes let the directory sort chronologically regardless of the tracker's issue numbers and reduce filename collisions. **Don't rename historical documents** to match the new format; they are frozen too.

### Guardrails

The skills refuse to overwrite or reuse an existing plan or Plan Deviations filename; a collision stops the run and gets reported. The skills do not commit anything. Committing a frozen plan or an accepted Plan Deviations document is your step, and keeping that commit to the document alone keeps the record readable.

`/guided-coding-write-deviations` renames and rewrites an unmerged Plan Deviations document and never changes a merged one. To find out which is which, it fetches the target branch and checks whether the document's path exists there. It stops without changing anything when it finds several Plan Deviations documents for the work item, when the new filename collides with an existing one, or when it cannot fetch or resolve the target branch - a stale branch cannot prove that a document is unmerged.

### Skills

- `/guided-coding-setup` creates `ai-plans/` and writes its `AGENTS.md`. Run it again to upgrade; it preserves your project-specific additions and never touches existing plans.
- `/guided-coding-write-plan` handles both first plans and follow-up plans, reading every earlier document for the issue before writing.
- `/guided-coding-review-plan` reviews a draft against the codebase in a fresh conversation. It reports findings and never edits anything.
- `/guided-coding-plan-and-review` writes the draft with `guided-coding-write-plan` and improves it through rounds of independent reviews before I read it. See [Automated Plan Review](./automated-plan-review.mdx).
- `/guided-coding-freeze-plan` ends the Planning Phase: it renames the draft with a UTC timestamp and the optional ticket ID, inserts the `*Frozen at ...*` line, and stops. I commit the frozen plan afterwards.
- `/guided-coding-implement` implements a frozen plan. It checks off an acceptance criterion only after the implementation satisfies it and the relevant feedback loop verifies the result.
- `/guided-coding-write-deviations` always writes a document when follow-up plans exist. With a single plan, it reports "no material deviations" rather than inventing entries when the implementation matched. Run again before the merge, it renames and rewrites the existing document. The skill only writes the file. After reviewing and accepting it, I commit it, create the pull request, and use its contents as the PR description with a normal prompt.

See [Guided Coding: Getting Started](./guided-coding-getting-started.mdx) for the full sequence.
:::
