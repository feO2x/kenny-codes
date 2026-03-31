---
slug: 2026-03-31-is-github-spec-kit-sdd
title: Markdown is not Spec-Driven Development
authors: [feO2x]
tags: [ai, coding-agents, guided-coding]
---

In 2025, a wave of tools like GitHub Spec Kit and Amazon Kiro reinvigorated the term Spec-Driven Development (SDD) as a counterpart to Vibe Coding. They use markdown specifications and plans to steer coding agents - but is SDD the right term for this approach?

<!-- truncate -->

## TL;DR

In my opinion, the term "Spec-Driven Development" is misleading in the context of tools like [GitHub Spec Kit](https://github.com/github/spec-kit) and [Amazon Kiro](https://kiro.dev). Their specifications are neither formal nor executable, cannot reliably be kept in sync with the codebase, and cannot be validated in the same way that formal or executable specifications can.

SDD has a rich history spanning several decades and includes formal methods, model-driven approaches, and specialized tooling. Especially when you want to bring less-experienced software developers up to speed with AI coding agents, I suggest you take a look at [Guided Coding](/docs/guided-coding/) instead of simply pointing to SDD and tools like GitHub Spec Kit and Amazon Kiro.

## Different Types of Specification

To make that distinction clearer, it helps to separate three different levels of specification. They are related, but they are not interchangeable, and they offer very different guarantees.

### Level 1: Informal and Structured Specification

As of writing this article in March 2026, I have more than 16 years of experience in software development and have never worked in a project where we did not use natural language to describe how we want to build our software. In simple cases, the text could be informal, but most of the time we used a given structure like use-case driven methods, structural analysis and UML for diagrams.

You can create these requirement documents relatively fast. Tools like [Jira](https://www.atlassian.com/software/jira), [GitHub Issues and Projects](https://github.com/features/issues), etc. allow you to track and connect them with artifacts like commits, CI/CD pipeline runs and deployments for traceability.

The most important thing: they can easily be used to communicate with non-technical colleagues and clients. The biggest drawback: they remain open to interpretation - you require a human to bridge the gap between the spec and the code. The spec can also become stale over time and requires updates by a human.

I still think this is the most viable approach when it comes to specifications for most software teams. You need a moderate amount of knowledge to succeed in this category.

This is also the level where most AI-oriented markdown workflows like Spec Kit and Kiro live today. They are structured, useful, and often much better than jumping straight into implementation. But that does not automatically make them part of the stronger historical tradition associated with SDD.

### Level 2: Formal Specification

Consider that you work on a critical software project where you need to be certain that no bug is delivered (e.g., software for nuclear plants, controller software for medical hardware, avionics). This is one historical branch of specification-driven approaches in the stronger sense: the specification is not just descriptive text, but a formal artifact you can reason about and verify. There are dedicated toolsets for this, for example:

- **[Z notation](https://en.wikipedia.org/wiki/Z_notation)** (Abrial, 1977; further developed at Oxford): Based on set theory and predicate calculus. Used in the IBM CICS project, which won a Queen's Award for Technological Achievement in 1992. Z specs are mathematically precise — they can be proven consistent, and refinement calculus allows you to derive implementations that provably satisfy the spec.
- **[Alloy](https://alloytools.org/)** (Jackson, MIT, 1997–present): A "lightweight" formal method using first-order relational logic. The Alloy Analyzer performs exhaustive finite-scope model checking. You write a declarative spec, and the tool automatically finds counterexamples to your assertions. Alloy 6 added mutable state and temporal logic.
- **[TLA+](https://lamport.azurewebsites.net/tla/tla.html)** (Lamport, 1993–present): [Used at Amazon Web Services](https://lamport.azurewebsites.net/tla/amazon-excerpt.html) to verify distributed systems designs. Specs are mathematical formulas in temporal logic. The TLC model checker exhaustively verifies properties. Famously, AWS engineers found critical bugs in production systems by writing TLA+ specs *after* the systems were already running.

These kinds of specs require a formal language grounded in logic, set theory, or temporal reasoning. They are powerful, but they are not well suited for communication with non-technical colleagues and they require real training.

Here is a tiny Alloy example to make this more concrete:

```alloy
sig User {}
sig Session { owner: one User }

assert NoSharedSession {
	all s1, s2: Session |
		s1.owner = s2.owner implies s1 = s2
}

check NoSharedSession
```

This is not prose about the system. It is a formal model. The Alloy Analyzer can search for counterexamples and tell you whether your assertion holds within a given scope.

### Level 3: Executable Specifications and Model-Driven Architecture

The most ambitious tier, where specifications don't just describe or constrain — they generate:

- **Executable UML / [fUML](https://www.omg.org/spec/FUML/)**: UML models with precise enough semantics to be simulated and compiled directly to code. Championed by Shlaer-Mellor and later adopted by OMG's MDA initiative (2001).
- **[Model-Driven Architecture (MDA)](https://www.omg.org/mda/)**: The OMG's vision of Platform-Independent Models (PIMs) transformed into Platform-Specific Models (PSMs) and then into code via formal, standardized transformations ([QVT](https://www.omg.org/spec/QVT/)). The spec *is* the primary artifact; code is a derived, regenerable output.
- **[Enterprise Architect](https://sparxsystems.com/products/ea/), [Rhapsody](https://www.ibm.com/products/engineering-rhapsody/), [Rational Rose](https://en.wikipedia.org/wiki/IBM_Rational_Rose)**: Tools that supported round-trip engineering — specifications and code kept in sync bidirectionally. Models could generate code skeletons; code changes could be reflected back into models.
- **Domain-Specific Languages (DSLs)**: Custom formal languages for specific problem domains (e.g., [JetBrains MPS](https://www.jetbrains.com/mps/), [Xtext](https://eclipse.dev/Xtext/)), where the "specification" is written in a constrained formal language that compiles directly to implementation.

At this level, specifications are **living artifacts**: they are validated by tools, checked for internal consistency, tested via simulation or model checking, and used to generate code. The spec isn't documentation — it's a machine-readable contract.

To make that more tangible, consider an executable state-machine model like this:

```xml
<scxml initial="locked">
  <state id="locked">
    <transition event="coin" target="unlocked" />
  </state>
  <state id="unlocked">
    <transition event="push" target="locked" />
  </state>
</scxml>
```

In an executable-modeling environment, this kind of artifact can be simulated before production code exists. In some toolchains, it can also be transformed into generated implementation skeletons. That is much closer to the traditional promise of SDD than a markdown plan interpreted by an LLM.

So where do modern AI-driven specification tools fall in this hierarchy?

## And what does GitHub Spec Kit actually do?

Spec Kit defines a phased process: **Constitution → Specify → Plan → Tasks → Implement**. Each phase produces markdown files. The constitution captures non-negotiable principles. The specification describes features and behavior in natural language. The plan breaks down technical approach. Tasks are small, testable units. An AI agent then implements each task.
 
Similarly, `AGENTS.md` and `CLAUDE.md` files provide AI agents with project conventions, build instructions, testing commands, and coding patterns — also in natural-language markdown.

The resulting markdown files are useful, but they are neither formal specifications in the Level 2 sense nor executable, machine-checked specifications in the Level 3 sense. You cannot run a Spec Kit spec to see if the described behavior is what you intended before any code exists. Alloy lets you explore counterexamples to your design before you write a single line of implementation. An executable model can be simulated. A markdown spec is primarily human-readable: humans can discuss and reason about it, while LLMs use it as steering context during implementation.

The markdown spec can also drift from the code just as easily as any PRD. The `/analyze` command performs heuristic consistency checks, but these are AI-driven pattern matching, not formal verification or model execution.

That does not make Spec Kit or Kiro bad tools. **But be careful: If you tell developers that they are doing "SDD," you connect them to a much older body of ideas, practices, and tooling than the workflow actually provides. What they are really doing is structured planning for agent-assisted implementation.**

[Birgitta Böckeler's taxonomy](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) gives a useful vocabulary for that distinction. She describes three modes: **spec-first**, **spec-anchored**, and **spec-as-source**. Her taxonomy describes how specifications are used during implementation, while the three levels of this blog post describe different types of specification.

Nonetheless, her framing strengthens the point: most current AI-agent workflows sit at Level 1 while behaving operationally as spec-first or spec-anchored. Truly spec-as-source workflows are much closer to Level 3, where the specification is the primary, regenerable artifact.

## Where Agentic Coding Fits

One question matters here: **Is agentic coding just an execution step for informal, structured specifications?** Many LLMs behind coding agents are impressive and can produce very strong results - but they are not deterministic. MDA used [QVT](https://www.omg.org/spec/QVT/) (Query/View/Transformation) to transform PIMs to PSMs. The transformation rules were themselves formally specified. In "modern SDD", the "transformation" is an LLM prompt.

To be fair, this trade-off isn't purely a weakness. Formal methods give you *guarantees* at the cost of *expressiveness* — you can only specify what the formal language can express. LLMs give you *expressiveness* at the cost of *guarantees* — you can describe almost anything, but you can't prove the output is correct. The interesting pragmatic question is whether automated tests can serve as the verification layer that formal specs traditionally provided. Spec Kit's implementation phase does produce tests, and that's not nothing — but it's a fundamentally different kind of assurance than mathematical proof. The stakes determine whether that's sufficient: for avionics software, absolutely not - but it probably is for your enterprise app.

That difference is exactly why the naming debate matters. **"Spec-Driven Development" sounds like a continuation of a tradition where the specification itself carries strong semantic weight. In agentic coding workflows, the markdown file mostly coordinates decomposition, communication, and sequencing.**

## Focus on Code, Use Plans as Scaffolding

Historically, stronger forms of SDD treated the specification or model as the primary artifact and source of truth. That makes sense when the spec can be verified, simulated, transformed, or kept in sync with the implementation. Markdown-first agent workflows do not give you that property. For them, I suggest the opposite emphasis: **focus on the code and use plans as scaffolding**.

Here's what I think these tools actually get right, even if the terminology is wrong: they force *decomposition and sequencing*. Breaking a vague idea into a constitution, a spec, a plan, and discrete tasks is exactly the skill that less-experienced developers struggle with most. The spec itself isn't the valuable artifact — the *process of creating it* is.

That is why I find [Guided Coding](/docs/guided-coding/) to be a better framing for developers. It is clearer about what is happening: you are using plans, rules, and iterative feedback to guide implementation work done by humans and coding agents. The markdown spec is scaffolding, not the final source of truth. The code is. That is also why it is a bad idea to tell your developers to "do SDD" and then hand them a markdown workflow plus an LLM - they might get lost in SDD's rich history.
