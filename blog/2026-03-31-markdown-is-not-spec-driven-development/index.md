---
slug: 2026-03-31-is-github-spec-kit-sdd
title: Markdown is not Spec-Driven Development
authors: [feO2x]
tags: [ai, coding-agents, guided-coding]
---

In 2025, a wave of tools like [GitHub Spec Kit](https://github.com/github/spec-kit) and [Amazon Kiro](https://kiro.dev) reinvigorated the term Spec-Driven Development (SDD) as a counterpart to Vibe Coding. They use markdown specifications and plans to steer coding agents - but is SDD the right term for this approach?

<!-- truncate -->

## TL;DR

In my opinion, the term "Spec-Driven Development" is misleading in the context of tools like [GitHub Spec Kit](https://github.com/github/spec-kit) and [Amazon Kiro](https://kiro.dev). The specification is neither formal nor executable, cannot be kept in sync with the codebase, and cannot be validated by corresponding tools.

SDD has a rich, long history spanning several decades. Especially when you want to bring less-experienced software developers up to speed with AI Coding Agents, I suggest you take a look at [Guided Coding](/docs/guided-coding/) instead of simply pointing to SDD and GitHub Spec Kit and Amazon Kiro.

## Level 1: Informal and Structured Specification

As of writing this article in March 2026, I have more than 16 years of experience in software development and have never worked in a project where we did not use natural language to describe how we want to build our software. In simple cases, the text could be informal, but most of the time we used a given structure like use-case driven methods, structural analysis and UML for diagrams.

You can create these requirement documents relatively fast. Tools like [Jira](https://www.atlassian.com/software/jira), [GitHub Issues and Projects](https://github.com/features/issues), etc. allow you to track and connect them with artifacts like commits, CI/CD pipeline runs and deployments for traceability.

The most important thing: they easily can be used for communicating with non-technical colleagues and clients. The biggest drawback: they remain open to interpretation - you require a human to bridge the gap between the spec and the code. The spec can also become stale over time and requires updates by a human to stay up to date.

I still think this is the most viable approach you should be going for when it comes to specifications. You need a moderate amount of knowledge to succeed in this category.

## Level 2: Formal Specification

Consider that you work on a critical software project where you need to be certain that no bug is delivered (e.g., software for nuclear plants, controller software for medical hardware, etc.). This is where SDD comes into play because it helps you with designing and verifying the system you want to build. There are additional toolsets for this, for example:

- **[Z notation](https://en.wikipedia.org/wiki/Z_notation)** (Abrial, 1977; further developed at Oxford): Based on set theory and predicate calculus. Used in the IBM CICS project, which won a Queen's Award for Technological Achievement in 1992. Z specs are mathematically precise — they can be proven consistent, and refinement calculus allows you to derive implementations that provably satisfy the spec.
- **[Alloy](https://alloytools.org/)** (Jackson, MIT, 1997–present): A "lightweight" formal method using first-order relational logic. The Alloy Analyzer performs exhaustive finite-scope model checking. You write a declarative spec, and the tool automatically finds counterexamples to your assertions. Alloy 6 added mutable state and temporal logic.
- **[TLA+](https://lamport.azurewebsites.net/tla/tla.html)** (Lamport, 1993–present): [Used at Amazon Web Services](https://lamport.azurewebsites.net/tla/amazon-excerpt.html) to verify distributed systems designs. Specs are mathematical formulas in temporal logic. The TLC model checker exhaustively verifies properties. Famously, AWS engineers found critical bugs in production systems by writing TLA+ specs *after* the systems were already running.

These kinds of specs require you to use a formal language relating to declarative code and mathematical calculus. It is not suitable for communication with non-technical colleagues and you need to be aware of syntax details.

## Level 3: Executable Specifications and Model-Driven Architecture

The most ambitious tier, where specifications don't just describe or constrain — they generate:

- **Executable UML / [fUML](https://www.omg.org/spec/FUML/)**: UML models with precise enough semantics to be simulated and compiled directly to code. Championed by Shlaer-Mellor and later adopted by OMG's MDA initiative (2001).
- **[Model-Driven Architecture (MDA)](https://www.omg.org/mda/)**: The OMG's vision of Platform-Independent Models (PIMs) transformed into Platform-Specific Models (PSMs) and then into code via formal, standardized transformations ([QVT](https://www.omg.org/spec/QVT/)). The spec *is* the primary artifact; code is a derived, regenerable output.
- **[Enterprise Architect](https://sparxsystems.com/products/ea/), [Rhapsody](https://www.ibm.com/products/engineering-rhapsody/), [Rational Rose](https://en.wikipedia.org/wiki/IBM_Rational_Rose)**: Tools that supported round-trip engineering — specifications and code kept in sync bidirectionally. Models could generate code skeletons; code changes could be reflected back into models.
- **Domain-Specific Languages (DSLs)**: Custom formal languages for specific problem domains (e.g., [JetBrains MPS](https://www.jetbrains.com/mps/), [Xtext](https://eclipse.dev/Xtext/)), where the "specification" is written in a constrained formal language that compiles directly to implementation.

 
At this level, specifications are **living artifacts**: they are validated by tools, checked for internal consistency, tested via simulation or model checking, and used to generate code. The spec isn't documentation — it's a machine-readable contract.

So where do modern AI-driven specification tools fall in this hierarchy?

## And what does GitHub Spec Kit actually do?

Spec Kit defines a phased process: **Constitution → Specify → Plan → Tasks → Implement**. Each phase produces markdown files. The constitution captures non-negotiable principles. The specification describes features and behavior in natural language. The plan breaks down technical approach. Tasks are small, testable units. An AI agent then implements each task.
 
Similarly, `AGENTS.md` and `CLAUDE.md` files provide AI agents with project conventions, build instructions, testing commands, and coding patterns — also in natural-language markdown.

The resulting markdown files are neither formal documents (Level 2) nor executable, syncable or simulatable specifications (Level 3) in the traditional sense. You cannot run a Spec Kit spec to see if the described behavior is what you intended before any code exists. Alloy lets you explore counterexamples to your design before you write a single line of implementation. A markdown spec just sits there.

Furthermore, the spec can drift from the code just as easily as any PRD. The `/analyze` command performs heuristic consistency checks, but these are AI-driven pattern matching, not formal verification.

## The Elephant in the Room

What we as a community actually have to decide on: **Is Agentic Coding an Execution of the informal/structured specifications?** Many LLMs behind coding agents are pretty great and can provide magnificent results - but they are not deterministic. MDA used [QVT](https://www.omg.org/spec/QVT/) (Query/View/Transformation) to transform PIMs to PSMs. The transformation rules were themselves formally specified. In "modern SDD", the "transformation" is an LLM prompt.

To be fair, this trade-off isn't purely a weakness. Formal methods give you *guarantees* at the cost of *expressiveness* — you can only specify what the formal language can express. LLMs give you *expressiveness* at the cost of *guarantees* — you can describe almost anything, but you can't prove the output is correct. The interesting pragmatic question is whether automated tests can serve as the verification layer that formal specs traditionally provided. Spec Kit's implementation phase does produce tests, and that's not nothing — but it's a fundamentally different kind of assurance than mathematical proof. The stakes determine whether that's sufficient: for avionics software, absolutely not - but it probably is for your enterprise app.

## Don't Focus on the Plans

Traditionally, SDD has always focused on the plans. I suggest you focus on the code.

Here's what I think these tools actually get right, even if the terminology is wrong: they force *decomposition and sequencing*. Breaking a vague idea into a constitution, a spec, a plan, and discrete tasks is exactly the skill that less-experienced developers struggle with most. The spec itself isn't the valuable artifact — the *process of creating it* is.

But the spec is scaffolding, not architecture. It will drift from the code. It cannot be executed or verified. The code is the only artifact that tells you the truth about what your system does.

SDD has a long history spanning decades. In my opinion, it is a bad idea to tell your developers to get in touch with SDD and bring it into your organization. [Guided Coding](/docs/guided-coding/) is more focused and leads you into the pit of success by focusing not only on the plan, but even more on the code. This takes time, but with the help of AI you are still faster than without it.
