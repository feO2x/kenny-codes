---
sidebar_position: 1
title: CHACK in .NET
---

# CHACK in .NET

The rest of these docs describe CHACK without assuming a programming language. This section shows how it looks in the stack I use every day: ASP.NET Core, Entity Framework Core, xUnit, and the .NET base class library.

Each page here belongs to one or more pages of the methodology, and each methodology page links to its counterpart at the end:

| Methodology                                                                                         | In .NET                                                       |
|-----------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| [The Core](../the-core.mdx)                                                                         | [The Core in .NET](./the-core.md)                             |
| [Humble Objects](../humble-objects.mdx), [Clients and Sessions](../clients-and-sessions.md)         | [Clients and Sessions in .NET](./clients-and-sessions.md)     |
| [Automated Tests](../automated-tests.mdx)                                                           | [Testing in .NET](./testing.md)                               |
| [The Composition Root](../composition-root.mdx), [Vertical Slices](../vertical-slices.md)           | [The Composition Root in .NET](./composition-root.md)         |
| [Building Blocks of a Backend Feature](../building-blocks.md)                                       | [A Complete Slice in ASP.NET Core](./a-complete-slice.md)     |

If you're new to CHACK, it's worth reading the methodology page first. The .NET pages assume you already know why things are done the way they are, and focus on how.

## About the code samples

Apart from ASP.NET Core, Entity Framework Core, and the test packages a page mentions, the samples don't need any additional package.

Some of the base types you'll see are also available ready-made in my libraries. When that's the case, the page tells you at the end, so you can decide whether you'd rather write them yourself or take them from a package.

## Libraries that help

CHACK doesn't depend on any library. These ones just save you from writing the same things in every project:

- [Light.SharedCore](https://github.com/feO2x/Light.SharedCore) contains `ISession`, the base abstraction for Sessions, along with entity base classes and a clock abstraction.
- [Light.DatabaseAccess.EntityFrameworkCore](https://github.com/feO2x/Light.DatabaseAccess.EntityFrameworkCore) contains base classes for Clients and Sessions that use Entity Framework Core, with and without a dedicated transaction.
- [Light.PortableResults](https://github.com/feO2x/Light.PortableResults) implements the Result Pattern, including validation and the translation of results into HTTP responses.
- [Light.GuardClauses](https://github.com/feO2x/Light.GuardClauses) makes precondition checks short and readable.

## A reference implementation

The [CHACK repository](https://github.com/feO2x/CHACK) contains a reference implementation: an ASP.NET Core service with vertical slices, Clients backed by Entity Framework Core and PostgreSQL, hand-written Test Doubles, and Integration Tests with Testcontainers. It's still growing, and more involved use cases will follow.
