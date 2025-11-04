---
title: ".NET Threading in Detail"
date: 2017-03-15
type: Talk
duration: 2h
language: German
location: Ulm
country: Germany
event: .NET Developer Group Ulm
tags: [.NET, Multithreading, Asynchronous Programming, Performance, async await]
---

In this talk, we look into multithreading with .NET, especially into threads and the .NET Thread Pool. We learn about Synchronization Primitves and how async await and the Task Parallel Library (TPL) can be used to achieve your multithreading goals.

<!-- truncate -->

## Event Details

[![.NET Threading in Detail Video](/img/2017-03-15-video-thumbnail.png)](https://youtu.be/U5bTvc4yv5U?si=IcLtDLGnJWjD7WBo)

Multithreading has become indispensable in modern applications — whether to offload long-running operations from the UI thread or to distribute complex computations across multiple threads. One of the main challenges, however, is ensuring proper synchronization of data accessed by multiple threads. But what exactly does a lock do, and how does it affect the thread pool?

This talk explores these questions and much more. In addition to discussing synchronization primitives and synchronization contexts, as well as the use of async/await with the Task Parallel Library (TPL), we’ll take a closer look at the internals of the .NET thread pool. We’ll also examine how lock-free synchronization primitives can be used, along with the algorithms and data structures that emerge from them.

[More information](https://github.com/feO2x/NetThreadingInDetail)
