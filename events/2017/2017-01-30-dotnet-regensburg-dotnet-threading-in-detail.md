---
title: ".NET Threading in Detail"
date: 2017-01-30
type: Talk
duration: 2h
language: German
location: Regensburg
country: Germany
event: .NET User Group Regensburg
tags: [.NET, Multithreading, Asynchronous Programming, Performance, async await]
slug: 2017-01-30-dotnet-regensburg-dotnet-threading-in-detail
---

In this talk, we look into multithreading with .NET, especially into threads and the .NET Thread Pool. We learn about Synchronization Primitves and how async await and the Task Parallel Library (TPL) can be used to achieve your multithreading goals.

<!-- truncate -->

## Event Details

[![.NET Threading in Detail Video on YouTube](/img/2017-01-30-video-thumbnail-regensburg.png)](https://youtu.be/Le3w51xV3f8?si=oBmnyMvzy99Dp90B)

Multithreading has become indispensable in modern applications — whether to offload long-running operations from the UI thread or to distribute complex computations across multiple threads. One of the main challenges, however, is ensuring proper synchronization of data accessed by multiple threads. But what exactly does a lock do, and how does it affect the thread pool?

This talk explores these questions and much more. In addition to discussing synchronization primitives and synchronization contexts, as well as the use of async/await with the Task Parallel Library (TPL), we’ll take a closer look at the internals of the .NET thread pool. We’ll also examine how lock-free synchronization primitives can be used, along with the algorithms and data structures that emerge from them.

[More information](https://dotnetregensburg.github.io/2017/01/30/threading-im-detail/)
