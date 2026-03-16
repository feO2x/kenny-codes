---
sidebar_position: 2
title: Planning Phase
---

# 1. Planning Phase (~ 30–90 minutes)

Start a new conversation with your coding agent and iteratively create a plan together. This is essentially breaking down requirements into a technical task together with a coding agent:

- **Give the agent a role.** I use something like "With you being an expert .NET architect" in my first prompt of the planning phase. This focuses the agent on planning rather than jumping into implementation. Assigning roles tends to produce better results in my experience.
- **Discuss the feature.** Ask the agent how it would approach the problem. Review its suggestions about elements like design, refactorings, testing, and performance. Bring your own thoughts and questions to the table — this is a conversation, not delegation.
- **Commit the plan as a markdown file in the git repo.** I don't use the built-in "planning mode" of coding agents because plans typically end up in your user directory or in the chat. I want them committed to git — they serve as historical documents that explain why features were implemented a certain way.
- **End with repeated sanity checks.** At the end of the planning phase, I typically ask *"Would you add, change, or remove anything?"* This often catches things I didn't think of. Do this repeatedly until the plan stabilizes.

## Plan Structure

After some experimentation, I settled on three sections:

1. **Rationale** — Why do we want to build this? Why is this feature needed or why does this bug need fixing? This gives the agent context for the greater goal.
2. **Acceptance Criteria** — Bullet points that must be fulfilled for the feature to be approved. The agent in the implementation phase will use these to check of each aspect of the feature after it's been implemented.
3. **Technical Details** — Important parts of the codebase, extension points, types to modify or add, and design direction.

Keep plans focused. With Anthropic models in particular (Opus, Sonnet), plans tend to become very detailed with implementation phases and step-by-step instructions that the agent doesn't actually need. The models are smart enough to figure out the implementation order themselves. A plan that's too detailed can actually steer the agent in the wrong direction, because if you missed something, the overly prescriptive structure leaves no room for the agent to adapt.

A plan is not an epic, a user story, or an initiative — it should contain technical details. A product manager who doesn't know how to code is probably not the best person to discuss and review these plans. You should have technical knowledge when you are in the planning phase.

## AGENTS.md for writing AI plans

To steer agents to write plans in the aforementioned structure, I usually place this file in `ai-plans/AGENTS.md`. Read the contents carefully, you might need to adjust them for your specific project.

```md
# AGENTS.md for AI Plans

In this folder, we only keep Markdown files for AI plans. Each file has a four-digit prefix which corresponds to the GitHub issue number.

## How to Write Plans

1. Each plan consists of exactly the three following elements: a rationale, acceptance criteria, and technical details.
2. A rationale describes the overarching goal of the plan. Keep this concise, only elaborate when special circumstances require it. Use free text in this section of the plan.
3. Acceptance criteria is a list of requirements that must be met for the plan to be considered complete. Use check marks `- [ ]` for these in Markdown.
4. Technical details describes the changes on a technical level. Which classes and members should be extended, which design patterns should be used? How do we ensure performance? Avoid going into too much detail (do not write the finished implementation), but focus on the high-level design and how things are connected. It should give the implementer a clear picture of what needs to be done, but also give her or him freedom to implement the plan in a way that she or he deems best. The length of this section is highly dependent on the task that the plan addresses.
5. Regarding automated tests: it is usually enough to note that 'automated tests need to be written' as one check mark in the acceptance criteria list. If there are special requirements for the tests, these can be elaborated in the technical details section. But normally, you can simply leave these technical details out if the automated tests can be written in a straightforward way.
6. When a plan should involve micro benchmarks, these need to be included in the acceptance criteria list and optionally in the technical details section. As with automated tests, if the BenchmarkDotNet benchmarks can be written in a straightforward way, leave out the technical details.
```
