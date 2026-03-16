---
sidebar_position: 5
title: Keep Your Rules Files Small
---

# Keep Your Rules Files Small

A study published in February 2026 found that agents MD files (or equivalent rules files in other tools) generally don't bring measurable benefit but cost about 20% more tokens. My approach aligns with this finding:

- **Start with a minimal agents MD file.** Mine is really short — a brief description of the project, a few rules that address past violations, and references to sub-rule files for production code, testing, and plans.
- **Only add rules when a coding agent repeatedly makes the same mistake.** For example, when Opus kept creating nested test classes in .NET (which I don't want), I added a rule saying "don't do that."
- **Context rot matters more than comprehensive rules.** The beginning of the context window is the most valuable part. If it's filled with massive rule files and dozens of MCP server endpoints, you're wasting precious tokens that could be used for actual implementation context.

I also add a "here is your space" section to my agents MD, where the model can document anything unusual it finds in the codebase. This occasionally surfaces design flaws or leads to new rules.
