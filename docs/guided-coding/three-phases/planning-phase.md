---
sidebar_position: 1
title: Planning Phase
---

# 1. Planning Phase (30–90 minutes)

You start a new session with your coding agent and iteratively create a plan together. This is essentially requirements engineering combined with a coding agent:

- **Give the agent a role.** I use something like "With you being an expert .NET architect" during the planning phase. This focuses the agent on planning rather than jumping into implementation. Assigning roles tends to produce better results in my experience.
- **Discuss the feature.** Ask the agent how it would approach the problem. Review its suggestions about design, refactorings, testing, and performance. Bring your own thoughts and questions to the table — this is a conversation, not delegation.
- **Write the plan as a markdown file in the git repo.** I don't use the built-in "planning mode" of coding agents because plans typically end up in your user directory rather than in the repository. I want them committed to git — they serve as historical documents that explain why features were implemented a certain way.
- **End with a sanity check.** My final question is always: *"With you being the expert, would you add, change, or remove anything from the plan?"* This often catches things you didn't think of.

## Plan Structure

After some experimentation, I settled on three sections, mirroring how we structure Jira tickets at work:

1. **Rationale** — Why do we want to build this? Why is this feature needed or why does this bug need fixing?
2. **Acceptance Criteria** — Bullet points that must be fulfilled for the feature to be approved.
3. **Technical Details** — Important parts of the codebase, extension points, types to modify or add, and design direction.

Keep plans focused. With Anthropic models in particular (Opus, Sonnet), plans tend to become very detailed with implementation phases and step-by-step instructions that the agent doesn't actually need. The models are smart enough to figure out the implementation order themselves. A plan that's too detailed can actually steer the agent in the wrong direction, because if you missed something, the overly prescriptive structure leaves no room for the agent to adapt.

A plan is not a user story — it should contain technical details. A product manager who doesn't know how to code is probably not the best person to write these plans. You should have technical knowledge when you are in the planning phase.
