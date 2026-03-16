---
sidebar_position: 9
title: "Comparison: Vise Coding & Spec-Driven Development"
---

# Comparison: Vise Coding & Spec-Driven Development

Guided Coding is not the only methodology that emerged as a counterpart to Vibe Coding. Two other notable approaches are **Vise Coding** and **Spec-Driven Development (SDD)**. All three share a common belief: blindly accepting AI-generated code is not viable for production software. But they differ in structure, emphasis, and adoption effort.

## Vise Coding

Dr. David Faragó [coined the term Vise Coding in March 2025](https://www.linkedin.com/pulse/vise-coding-david-farago-1k5ce/). The metaphor: like a craftsman's vise that holds a workpiece steady while precision tools are applied, Vise Coding uses documentation and process to constrain and guide the coding agent's output.

The core principles:

- **Small, high-quality changes** — the agent makes one focused change at a time, easy to review and verify.
- **Tests for every change** — any code the agent generates or modifies must be accompanied by tests.
- **Documentation updates** — the agent updates documentation after each change, and the developer reviews those updates too.
- **Detailed rules** — you communicate expectations to the agent through comprehensive rules files (e.g. Cursor rules) covering coding patterns, technical stack, and workflow preferences.

Vise Coding is essentially a **per-change discipline**. You constrain the agent tightly on every iteration: prompt, review the change, have the agent update docs, review again.

### Where Guided Coding and Vise Coding overlap

Both approaches agree on the fundamentals:

- You must review and understand all generated code.
- Vibe Coding is not suitable for production software.
- The developer stays in control — the agent is a tool, not a replacement.

### Where they differ

- **Planning**: Guided Coding has an explicit planning phase where you create a plan collaboratively with the agent and commit it to git. Vise Coding doesn't formalize planning as a separate step — you communicate constraints through rules and prompts.
- **Change granularity**: Vise Coding emphasizes very small changes per iteration. Guided Coding gives the agent more freedom during implementation — a single plan can result in hundreds or thousands of lines of changes, which you then review thoroughly in the guiding phase.
- **Rules vs. plans**: Vise Coding relies heavily on detailed rules files to constrain the agent's behavior. Guided Coding keeps rules files minimal and instead uses plans as the primary steering mechanism.
- **Iteration model**: In Guided Coding, the guiding phase can send you back to planning (for large issues) or back to implementation (for small ones). Vise Coding iterates at a smaller scale — change by change.
- **Feedback loops**: Guided Coding explicitly leverages automated feedback loops (tests, linters, benchmarks) to let the agent work autonomously for longer stretches. Vise Coding keeps the developer in the loop for every change.

In short: Vise Coding is more prescriptive at the individual change level, while Guided Coding is more structured at the workflow level, giving the agent more autonomy during implementation.

## Spec-Driven Development

Spec-Driven Development has a long history in software engineering, but it means different things depending on who you ask.

### Traditional SDD: Formal methods

The original flavor of SDD uses formal specification languages — Z-notation, Alloy, TLA+, VDM, or the B-method — to describe system behavior mathematically. You write a precise specification, then derive or verify code against it. This approach is powerful for safety-critical systems (aerospace, medical devices, financial systems) but has always had limited adoption due to its steep learning curve and the overhead of maintaining formal models.

### Modern SDD: GitHub Spec Kit

[GitHub's Spec Kit](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/) adapts the *idea* of specs for AI-assisted development, but uses natural language rather than formal methods. It defines four phases:

1. **Specify** — describe what you're building and why, the agent generates a detailed spec.
2. **Plan** — provide your tech stack and constraints, the agent creates a technical plan.
3. **Tasks** — the agent breaks the spec and plan into small, reviewable work items.
4. **Implement** — the agent tackles tasks one by one.

Spec Kit puts the specification at the center as a "source of truth" that drives everything downstream. It's a more structured and heavyweight process than Guided Coding, with a strong emphasis on up-front specification.

### Where Guided Coding and SDD overlap

- Both use a planning step before implementation.
- Both break work into manageable pieces.
- Both keep the developer in a steering and reviewing role.

### Where they differ

- **Specification depth**: Spec Kit's specify phase focuses on user journeys, experiences, and outcomes — a product-level document. Guided Coding plans are technical documents with rationale, acceptance criteria, and implementation details. They're written *by* developers *for* developers (and agents).
- **Review phase**: Guided Coding has an explicit guiding phase where you spend the majority of your time reviewing code, evaluating design, and deciding whether to iterate. Spec Kit's review happens at phase boundaries but doesn't formalize the code review as a distinct, time-intensive phase.
- **Iteration**: Guided Coding explicitly encourages going back — from guiding to planning, from guiding to implementation. The feedback arrows are central to the methodology. Spec Kit's phases are more sequential, though it does mention refining specs.
- **Weight**: Spec Kit is a heavier process with tooling (`specify` CLI, slash commands, generated artifacts). Guided Coding is deliberately lean — markdown files in git, any coding agent, no special tooling required.
- **Adoption**: Guided Coding can be adopted incrementally with minimal setup. You start writing plans in markdown and reviewing code more thoroughly. Spec Kit requires buying into its toolchain and artifact structure.

## At a glance

| | **Vibe Coding** | **Vise Coding** | **Spec-Driven (Spec Kit)** | **Guided Coding** |
|---|---|---|---|---|
| **Core idea** | Accept everything, never read the code | Constrain every change via rules and review | Spec as source of truth, agent generates artifacts | Plan iteratively, implement autonomously, guide thoroughly |
| **Planning** | None | Via rules and prompts | Formal specify → plan → tasks pipeline | Collaborative markdown plans committed to git |
| **Change size** | Unbounded | Small, one at a time | Task-sized chunks | Plan-sized (hundreds to thousands of lines) |
| **Review** | None (look at the running app) | Every change, including docs | At phase boundaries | Dedicated guiding phase (most time spent here) |
| **Iteration** | Forward only | Change-level iteration | Phase-level refinement | Explicit loops back to planning or implementation |
| **Tooling required** | Any coding agent | Markdown + any coding agent | Spec Kit CLI + coding agent | Markdown + any coding agent |
| **Adoption effort** | Zero | Low | Medium | Low |
| **Best suited for** | Prototypes, throwaway projects | TDD-heavy workflows, small changes | Large teams, product-level specs | Iterative feature development, enterprise software |

## They're not mutually exclusive

These approaches aren't in competition — they address different aspects of the problem. You could combine Vise Coding's per-change discipline with Guided Coding's planning and guiding phases. You could use Spec Kit's specification process to feed into Guided Coding plans. The key insight all three share is the same: **you are responsible for the code, not the agent.**

Pick what works for your team, your project, and your workflow. Guided Coding's strength is that it's lean enough to adopt quickly, even for devs with less experience, while structured enough to scale to enterprise codebases.
