---
sidebar_position: 14
title: "Comparison: Vise Coding & Spec-Driven Development"
image: /img/social-cards/docs-guided-coding-comparison.jpg
---

# Comparison: Vise Coding & Spec-Driven Development

Guided Coding is not the only methodology that emerged as a counterpart to Vibe Coding. Two other notable approaches are **Vise Coding** and **Spec-Driven Development (SDD)**. All three share a common belief: blindly accepting AI-generated code is not viable for production software. But they differ in structure, emphasis, and adoption effort.

## Vise Coding

Dr. David Faragó [coined the term Vise Coding in March 2025](https://www.linkedin.com/pulse/vise-coding-david-farago-1k5ce/). The metaphor: like a craftsman's vise that holds a workpiece steady while precision tools are applied, Vise Coding uses documentation and process to constrain and guide the coding agent's output.

The core principles:

- **Small, high-quality changes** - the agent makes one focused change at a time, easy to review and verify.
- **Tests for every change** - any code the agent generates or modifies must be accompanied by tests.
- **Documentation updates** - the agent updates documentation after each change, and the developer reviews those updates too.
- **Detailed rules** - you communicate expectations to the agent through comprehensive rules files (e.g. Cursor rules) covering coding patterns, technical stack, and workflow preferences.

Vise Coding is essentially a **per-change discipline**. You constrain the agent tightly on every iteration: prompt, review the change, have the agent update docs, review again.

### Where Guided Coding and Vise Coding overlap

Both approaches agree on the fundamentals:

- You must review and understand all generated code.
- Vibe Coding is not suitable for production software.
- The developer stays in control - the agent is a tool, not a replacement.

### Where they differ

- **Planning**: Guided Coding has an explicit planning phase where you create a plan collaboratively with the agent and commit it to git. Vise Coding doesn't formalize planning as a separate step - you communicate constraints through rules and prompts.
- **Change granularity**: Vise Coding emphasizes very small changes per iteration. Guided Coding gives the agent more freedom during implementation - a single plan can result in hundreds or thousands of lines of changes, which you then review thoroughly in the guiding phase.
- **Rules vs. plans**: Vise Coding relies heavily on detailed rules files to constrain the agent's behavior. Guided Coding keeps rules files minimal and instead uses plans as the primary steering mechanism.
- **Iteration model**: In Guided Coding, the guiding phase can send you back to planning (for large issues) or back to implementation (for small ones). Vise Coding iterates at a smaller scale - change by change.
- **Feedback loops**: Guided Coding uses automated feedback loops (tests, linters, benchmarks) to let the agent work autonomously for longer stretches. Vise Coding keeps the developer involved in every change.

In Vise Coding, you constrain each change in detail. Guided Coding structures the work into phases and gives the agent more freedom during implementation.

## Spec-Driven Development

Spec-Driven Development has a long history in software engineering, but it means different things depending on who you ask.

### Traditional SDD: Formal methods

The original flavor of SDD uses formal specification languages - Z-notation, Alloy, TLA+, VDM, or the B-method - to describe system behavior mathematically. You write a precise specification, then derive or verify code against it. This approach is powerful for safety-critical systems (aerospace, medical devices, financial systems) but has always had limited adoption due to its steep learning curve and the overhead of maintaining formal models.

### Modern SDD: GitHub Spec Kit

[GitHub's Spec Kit](https://github.com/github/spec-kit) adapts the *idea* of specs for AI-assisted development, but uses natural language rather than formal methods. Its current core workflow carries several artifacts through development:

1. **Constitution** - establish the project's governing principles and development guidelines.
2. **Specify** - describe what you're building and why; the agent generates a detailed spec.
3. **Plan** - provide your tech stack and constraints; the agent creates a technical plan.
4. **Tasks** - the agent breaks the spec and plan into small, reviewable work items.
5. **Implement** - the agent tackles the generated tasks.

Spec Kit puts the specification at the center as a "source of truth" that drives everything downstream. It's a more structured and heavyweight process than Guided Coding, with a strong emphasis on up-front specification.

### Where Guided Coding and SDD overlap

- Both use a planning step before implementation.
- Both break work into manageable pieces.
- Both keep the developer in a steering and reviewing role.

### Where they differ

- **Specification depth**: Spec Kit's specify phase focuses on user journeys, experiences, and outcomes - a product-level document. Guided Coding plans are technical documents with rationale, acceptance criteria, and implementation details. They're written *by* developers *for* developers (and agents).
- **Review phase**: Guided Coding has an explicit guiding phase where you spend the majority of your time reviewing code, evaluating design, and deciding whether to iterate. Spec Kit's review happens at phase boundaries but doesn't formalize the code review as a distinct, time-intensive phase.
- **Iteration**: Guided Coding explicitly encourages going back - from guiding to planning, from guiding to implementation. The feedback arrows are central to the methodology. Spec Kit's phases are more sequential, though it does mention refining specs.
- **Weight**: Spec Kit covers more of the development process, with its `specify` CLI, commands or skills, templates, and generated files. Guided Coding records decisions in plans, follow-up plans when needed, and a Plan Deviations document when required.
- **Adoption**: Guided Coding can be adopted incrementally with minimal setup. You start writing plans in Markdown and reviewing code more thoroughly. Spec Kit requires buying into its toolchain and artifact structure.
- **Record**: Spec Kit's spec is a living source of truth kept in sync with the system. Guided Coding's `ai-plans/` is an append-only record of decisions: plans freeze, and corrections are appended rather than merged in. One optimizes for describing the system as it is, the other for explaining how it got that way.

Guided Coding's [optional skills](https://github.com/feO2x/guided-coding) write and review plans, freeze them with timestamped filenames, and record deviations. The approaches differ in how much of the development process they document for agents to read.

Spec Kit creates a constitution, specification, plan, and task list, along with instructions for using them. [BMad](https://github.com/bmad-code-org/BMAD-METHOD) also covers product planning, architecture, UX, development, and testing. These documents can help larger teams work consistently and trace decisions. They also give agents more information to read and usually increase token use. Guided Coding keeps the documents agents read focused on plans and decision changes for each piece of work.

## At a glance

| | **Vibe Coding** | **Vise Coding** | **Spec-Driven (Spec Kit)** | **Guided Coding** |
|---|---|---|---|---|
| **Core idea** | Accept everything, never read the code | Constrain every change via rules and review | Spec as source of truth, agent generates artifacts | Plan iteratively, implement autonomously, guide thoroughly |
| **Planning** | None | Via rules and prompts | Constitution → specify → plan → tasks pipeline | Collaborative Markdown plans committed to git |
| **Change size** | Unbounded | Small, one at a time | Task-sized chunks | Plan-sized (hundreds to thousands of lines) |
| **Review** | None (look at the running app) | Every change, including docs | At phase boundaries | Dedicated guiding phase (most time spent here) |
| **Iteration** | Forward only | Change-level iteration | Phase-level refinement | Explicit loops back to planning or implementation |
| **Decision record** | None | Docs updated per change | Spec kept in sync | Append-only: frozen plans, follow-ups, deviations |
| **Tooling required** | Any coding agent | Markdown + any coding agent | Spec Kit CLI + coding agent | Markdown + any coding agent (skills optional) |
| **Adoption effort** | Zero | Low | Medium | Low |
| **Best suited for** | Prototypes, throwaway projects | TDD-heavy workflows, small changes | Large teams, product-level specs | Iterative feature development, enterprise software |

## They're not mutually exclusive

These approaches address different aspects of the problem and can be combined. You could use Vise Coding's per-change discipline with Guided Coding's planning and guiding phases, or use Spec Kit's specifications as input to Guided Coding plans. All three emphasize that **you are responsible for the code.**

Pick what works for your team, your project, and your workflow. You can start practicing Guided Coding with a small change and use the same approach as your codebase grows.
