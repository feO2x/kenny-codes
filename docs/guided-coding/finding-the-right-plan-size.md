---
sidebar_position: 6
title: Finding the Right Plan Size
---

# Finding the Right Plan Size

## The Goldilocks problem

There is no formula for the right plan size — you learn it empirically. The sweet spot depends on the model you use, the complexity of your codebase, the complexity of the feature you want to implement, and your own ability to review the output. But there are clear signs when a plan is too small or too large:

- **Too small** — if the plan is trivial, you could've done it yourself faster than creating the plan and reviewing the output. The overhead of the planning and guiding phases isn't worth it for changes that affect only a few lines of code or a simple refactoring.
- **Too large** — the agent produces lower quality results because it loses focus partway through, usually because of Context Rot / compaction. You end up creating additional plans anyway, and the guiding phase becomes overwhelming because the diff is too big to review thoroughly.

In my experience, a good plan results in 500 to 10,000 lines of code changes. That's large enough to be worth the process overhead, but small enough that you can still read and understand every line during review. The exact number will vary based on your project context. **Keep in mind that better code design can lead to better abstractions, reducing the amount of code.**

## You are the bottleneck, not the model

Even if future models can handle massive plans flawlessly, you as the reviewer are the limiting factor. A 10,000+-line PR is hard to review regardless of who — or what — wrote it. If you can't understand the full diff, you can't fulfill your role in the guiding phase, and the whole methodology breaks down.

## Signs your plan is too big

- The agent starts producing code that contradicts earlier parts of its own output.
- You find yourself skimming during review because the diff is too long.
- The implementation phase takes over an hour with no clear progress.
- You discover during review that the agent missed acceptance criteria from the plan.
- The agent struggles to establish common abstractions across the codebase because it finishes too early.

When this happens, don't force it — go back and split the plan. I had to learn this the hard way with a [CloudEvents serialization feature](https://github.com/feO2x/Light.PortableResults/blob/main/ai-plans/0015-cloud-events-serialization.md) where I tried to cover reading, writing, and performance in a single plan. I had to run through three smaller, focused plans to fix the initial issues.
