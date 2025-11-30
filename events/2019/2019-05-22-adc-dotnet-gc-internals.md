---
title: ".NET GC Internals: How the Garbage Collector Works Under the Covers"
date: 2019-05-22
type: Talk
duration: 1h
language: German
location: Regensburg
country: Germany
event: Advanced Developers Conference 2019
tags: [.NET, Memory Management, Garbage Collector, GC]
slug: 2019-05-22-adc-dotnet-gc-internals
---

In this talk, we explore the internals of the .NET Garbage Collector, examining how it allocates and deallocates memory, how it executes its collection runs, and how it structures memory into the Small Object Heap with generations and the Large Object Heap.

<!-- truncate -->

## Event Details

We rely on it in every app that we write: the Garbage Collector is a critical runtime component of .NET applications, but only few developers truly understand how it works. In this talk, we'll explore the internals of the GC, how it allocates memory and how it plans its memory collection runs in up to four phases. We'll also look at how the GC manages the Small Object Heap (SOH) and Large Object Heap (LOH), and how the SOH is divided into three generations. All this is accompanied by many memory snapshots, visualizing how the memory looks like in different stages of the GC process.

[More information](https://github.com/feO2x/Adc2019.DotnetGcInternals)
