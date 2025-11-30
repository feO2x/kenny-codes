---
title: "High Perf - .NET Performance Benchmarking and Garbage Collector in Detail"
date: 2019-12-11
type: Talk
duration: 3h
language: German
location: Graz
country: Austria
event: Microsoft Developer User Group Graz
tags: [.NET, Performance, BenchmarkDotNet, Memory Management, Garbage Collection]
slug: 2019-12-11-mdug-graz-high-perf
---

At this meetup, we explore both performance optimization techniques with BenchmarkDotNet and dive deep into the .NET Garbage Collector to understand how memory management affects application performance.

<!-- truncate -->

## Event Details

### .NET Garbage Collector in Detail

The Garbage Collector is one of the most important components of the .NET common language runtime. In this session, we’ll take a deep dive into it. We’ll discuss the different memory segments of a .NET process, especially Thread Stacks and the Managed Heap and clarify the meaning of the Small Object Heap and Large Object Heap. We also take a look at how the GC allocates memory when we call new on a reference type, and how GC runs are executed to reclaim allocated memory. The session concludes with some useful tips on how you should structure your code in performance-critical code segments where you don’t want interference from the GC.

[More information](https://github.com/feO2x/DNDGGraz.GCInternals)

### Introduction to Performance Optimization with BenchmarkDotNet

In this session, we’ll discuss how the Open Source library Light.GuardClauses was optimized for performance. We’ll take a look a different methods of the library and compare the performance to the previous version as well as to imperative code. We use BenchmarkDotNet which gives us the ability to write performance measurements in a unit-test-like manner. We’ll also discuss how BenchmarkDotNet executes its measurements internally.

[More information](https://github.com/feO2x/DNDGGraz.PerfOptimization)
