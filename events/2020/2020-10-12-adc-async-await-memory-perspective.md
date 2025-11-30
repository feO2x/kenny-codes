---
title: "Async Await Internals: Understand the Async State Machine from a Memory Perspective"
date: 2020-10-12
type: Talk
duration: 1h
language: German
location: Munich
country: Germany
event: Advanced Developers Conference 2020
tags: [.NET, async await, Memory Management]
slug: 2020-10-12-adc-async-await-memory-perspective
---

In this talk, we explore the internals of async/await from a memory perspective, examining how the compiler transforms async methods into state machines and how this state machine behaves during execution from a memory management point of view.

<!-- truncate -->

## Event Details

Since its official release with .NET Framework 4.5, async/await has become one of the most commonly used features in .NET development. This talk dives deep into understanding how the compiler transforms async methods into state machines. We'll take a look at how it looks like when translated back to C# code and debug through it, and additionally examine memory snapshots to understand how it behaves during execution. Through all this, we'll learn about the memory implications and performance characteristics of async/await.

[More information](https://github.com/feO2x/ADC2020AsyncInMemory)
