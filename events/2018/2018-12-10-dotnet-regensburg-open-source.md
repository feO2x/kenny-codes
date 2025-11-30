---
title: "Writing Open Source Software in .NET - With BenchmarkDotNet, Roslyn Source Generators and MSBuild Multitargeting"
date: 2018-12-10
type: Talk
duration: 2h
language: German
location: Regensburg
country: Germany
event: .NET User Group Regensburg
tags: [Open Source, .NET, Guard Clauses, Performance, Roslyn, Source Generators, MSBuild, BenchmarkDotNet]
slug: 2018-12-10-dotnet-regensburg-open-source
---

In this talk, we explore my open source library Light.GuardClauses and how I optimized certain features using Roslyn and source generators, BenchmarkDotNet, and the MSBuild multi-targeting system.

<!-- truncate -->

## Event Details

[![Writing Open Source Software in .NET Video on YouTube](/img/2018-12-10-video-thumbnail-regensburg.png)](https://youtu.be/lSYI_eBTpsA?si=aulrvQaDabaIIhMp)

In June 2016, the open-source library Light.GuardClauses was released for the first time.
In this talk, the author shares insights and behind-the-scenes experiences from working in the open-source ecosystem of Microsoft’s .NET platform.

After a brief introduction to what Light.GuardClauses actually does, we’ll dive into several current and practical topics:
- How to use the new csproj format introduced with MSBuild 15 to target multiple frameworks from a single project
- How to leverage the open-source C# compiler Roslyn to automatically generate and validate code
- How the library’s performance was optimized using BenchmarkDotNet

[More information](https://dotnetregensburg.github.io/2018/12/10/open-source/)
