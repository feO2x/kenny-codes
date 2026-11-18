---
sidebar_position: 15
title: Release Notes
---

# Release Notes

This page summarizes what changed in each version of the [Guided Coding skills](https://github.com/feO2x/guided-coding) and what it means for how you work. The complete list is in the [CHANGELOG on GitHub](https://github.com/feO2x/guided-coding/blob/main/CHANGELOG.md).

To upgrade a repository, update the skills as described in [Guided Coding: Getting Started](./guided-coding-getting-started.mdx#install), then run `guided-coding-setup` again. It brings `ai-plans/AGENTS.md` up to date and keeps your own additions.

## 2.1.0

Released on 2026-11-17.

- **Plan and review.** The new `guided-coding-plan-and-review` skill writes a plan and improves it through independent reviewers in fresh contexts, in rounds, up to a configured round limit. It addresses every finding, never changes a decision you made explicitly without your approval, and reports every finding with its resolution. See [Automated Plan Review](./automated-plan-review.mdx).
- **Skills that invoke skills.** Models may now invoke `guided-coding-write-plan` and `guided-coding-review-plan`, so that `guided-coding-plan-and-review` can use them. Their descriptions still limit them to explicit requests by you or by another Guided Coding skill.
- **RDAT plan structure.** An optional alternative to the default structure: Rationale, Decisions, Acceptance Criteria, and Technical Details. Numbered Decisions summarize what a reviewer approves, and each section adds information instead of repeating earlier ones. `guided-coding-write-plan` takes a plan structure when invoked, either the name of a bundled structure such as `rdat-plan-structure.md` or a path to your own Markdown file. `ai-plans/AGENTS.md` can name one the same way. See [Plan Structures](./plan-structures.md).
- **Premise checks before implementing.** The implementation skills verify a plan's assumptions against the code before they start.
- **Bounded workarounds.** When a plan decision or factual claim is wrong, or an acceptance criterion cannot be met as written, a workaround is allowed only when evidence confirms the error, the Rationale and all other decisions stay unchanged, no public API, scope, or dependency changes go beyond the plan, and no test is weakened or removed. Otherwise, `guided-coding-implement` stops the affected work and reports the problem, and the Guided Learning skills ask you how to proceed. Criteria met only through a workaround stay unchecked for the reviewer. See the [Implementing Phase](./implementing-phase.mdx#when-the-plan-is-wrong).
- **Plan Deviations documents stay editable until merged.** Instead of freezing once committed, a Plan Deviations document now freezes when it is merged into the target branch, so Follow-Up Plans from pull request reviews can still be recorded. `guided-coding-write-deviations` renames the document with a new timestamp on each update and rewrites it. Each work item keeps one document whose filename sorts after all its plans. Run `guided-coding-setup` to update `ai-plans/AGENTS.md`. See [The Plan Record](./plan-record.md#plan-deviations-documents).
- **Plain English.** The skill instructions and plan templates were rewritten in plain English, with shorter instructions and consistent terms. The workflows did not change.

## 2.0.0

Released on 2026-09-27.

Version 2.0.0 made one idea explicit that was only implicit before: `ai-plans/` is an **append-only decision record**. See [The Plan Record](./plan-record.md).

- **Frozen plans.** Plans freeze when their Planning Phase ends. From then on, the only permitted edit is checking off an acceptance criterion.
- **Plan Deviations documents.** Material departures from frozen plans are recorded in a Plan Deviations document. In 2.0.0, these documents froze once committed. Version 2.1.0 keeps them editable until they are merged.
- **UTC timestamps in filenames.** Plan and Plan Deviations filenames start with a UTC timestamp, so the directory reads in chronological order regardless of how your tracker numbers issues.
- **A history of decisions.** `ai-plans/` keeps frozen plans and records later decisions in new plans.
- **Agent Skills and Agent Plugin.** Guided Coding is distributed as portable Agent Skills and as an Agent Plugin, plus a Claude Code plugin with short, manually invoked skill names.
- **Guided Learning.** Two skills let you implement a plan yourself while the agent teaches you, and a learning profile in a private Git repository at `~/.guided-learning/profile.md` tracks your progress across sessions. See [Guided Learning: Getting Started](./guided-learning-getting-started.mdx).
