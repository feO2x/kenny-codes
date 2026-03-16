---
sidebar_position: 5
title: Keep Your Rules Files Small
---

# Keep Your Rules Files Small

## Less is more

A [study published in February 2026](https://arxiv.org/pdf/2602.11988) found that AGENTS.md files (or equivalent rules files in other tools) generally don't bring measurable benefit to code quality but cost about 20% more tokens. My approach aligns with this finding:

- **Start with a minimal agents MD file.** Mine is really short — a brief description of the project, a few rules that address past violations, and references to sub-rule files for production code, testing, and plans.
- **Only add rules when a coding agent repeatedly makes the same mistake.** For example, when Opus kept creating nested test classes in .NET (which I don't want), I added a corresponding rule to prevent this.
- **Context rot matters more than comprehensive rules.** As a conversation grows, early tokens lose influence on the model's behavior. If the beginning of the context window is filled with massive rule files and dozens of MCP server endpoints, you're wasting precious tokens that could be used for actual implementation context.

I also add a "here is your space" section to my AGENTS.md, where the model can document anything unusual it finds in the codebase. This occasionally surfaces design flaws or leads to new rules.

## Example top-level AGENTS.md file

This is an example of a top-level AGENTS.md file. I use it in [Light.PortableResults](https://github.com/feO2x/Light.PortableResults). Check out the codebase to learn how I organize my sub-rule files. **Please read the file carefully, you might want to adapt certain sections for your project.**

```md
# Root Agents.md

Light.PortableResults is a lightweight, high-performance library implementing the Result Pattern for .NET. It stands out for reducing allocations and being able to serialize and deserialize results across different protocols (HTTP via RFC-9457, gRPC, Asynchronous Messaging). Extensibility is less important than performance.

## Implementation rules

Plans typically have acceptance criteria with check boxes. Check each box when you are finished with the corresponding criterion.

## General Rules for the Code Base

In our Directory.Build.props files in this solution, the following rules are defined:

- Implicit usings or global usings are not allowed - use explicit using statements for clarity.
- The Light.PortableResults project is built with .NET Standard 2.0, but you can use C# 14 features.
- All other projects use .NET 10, including the test projects.
- The library is not published in a stable version yet, you can make breaking changes.
- `<TreatWarningsAsErrors>` is enabled in Release builds, so your code changes must not generate warnings.
- When a type or method is properly encapsulated, make it public. We don't know how callers would like to use this library. When some types are internal, this might make it hard for callers to access these in tests or when making configuration changes. Prefer public APIs over internal ones.

## Production Code Rules

Read ./src/AGENTS.md for details about the production code.

## Testing Rules

Read ./tests/AGENTS.md for details about how to write tests.

## Plan Rules

Read ./ai-plans/AGENTS.md for details on how to write plans.

## Here is Your Space

If you encounter something worth noting while you are working on this codebase, write it down here in this section. Once you are finished, I will discuss it with you and we can decide where to put your notes.
```
