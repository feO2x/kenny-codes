---
sidebar_position: 9
title: Reviewing for CHACK
image: /img/social-cards/docs-chack-reviewing-for-chack.jpg
---

# Reviewing for CHACK

CHACK is easy to explain, but it erodes quickly in daily work. Nobody sets out to put a SQL query in a domain entity; it happens one convenient shortcut at a time, usually late in a sprint. This page collects the checklist I use in code reviews and when assessing an unfamiliar codebase.

## The one question

Open any file and ask: **Which of the four categories does this exclusively belong to?**

- Core
- Humble Objects
- Automated Tests
- Composition Root

Most of the time, the answer comes quickly. When it turns out to be "two of them", you've found something worth discussing, and usually the right fix is to split the code. The checklist below covers the most common violations I run into during code reviews.

## In the Core

- **A type that performs I/O shows up.** A database context, an HTTP client, a connection, a file API, or a broker client - anything that talks to another process. Once it enters the Core, the code can no longer run in memory and its tests require a real third-party system. Introduce a Core-owned I/O abstraction instead. Small, substitutable framework abstractions like a logger are fine as they are.
- **Domain types or DTOs carry framework attributes.** Serialization, O/R mapping, or DI container attributes couple the type to how it's stored, transmitted, or composed. Move that configuration into separate types or into the Composition Root instead.
- **The DI container is injected.** The type now fetches its own dependencies, hiding them from the compiler, your tests, and other developers. If the type must create objects at runtime, inject an abstract factory instead.
- **The current time, new GUIDs, or random numbers are obtained directly.** Calling the system clock, a GUID generator, or a random number generator produces a different result on every run and makes tests non-deterministic. Pass these values through an abstraction.
- **Mutable static state is used.** It introduces hidden coupling, breaks test isolation, and causes race conditions that often only surface in production. Pass context objects through dependency injection instead.
- **An abstraction has a single implementation and no Test Double behind it.** Not automatically wrong, but ask why it exists. If nothing varies, drop the indirection.

## In Humble Objects

- **Branches, loops, validation, or business rules appear.** An `if` that is neither a precondition check nor part of mapping is usually a business decision. In the Core, you can cover that decision with fast Unit Tests; inside a Humble Object, you can only reach it with slower Integration Tests.
- **Mapping has grown complex enough that you want to unit-test it.** If it can run in memory, move it into a static method in the Core and call it from the Humble Object.
- **A read-only Humble Object is called a Session.** If the Core can't commit through it, name it a [Client](./clients-and-sessions.md).
- **A deferred query leaves the Humble Object.** When an unexecuted query escapes, query composition leaks into the Core and execution happens outside the Humble Object, where no Test Double can behave like the real database. Materialize the results inside the Humble Object.
- **Two third-party systems are accessed.** Split the Humble Object into one per system.
- **One abstraction serves several features, like a Repository.** Every feature ends up depending on methods it doesn't need, and transaction boundaries become hard to spot. Give each slice its own abstraction and share query code via static methods (see [Clients and Sessions](./clients-and-sessions.md#one-per-slice-not-one-per-entity)).
- **Resources aren't disposed.** If a Humble Object owns a connection, client, stream, or file handle, make it disposable and let the Composition Root manage its lifetime.
- **The view contains logic.** UI code is a Humble Object, too. Multi-bindings with rules, converters that make decisions, or logic embedded in printed reports all trap testable code where testing is painful. Move that logic into the Core.

## In Automated Tests

- **A Humble Object or the Composition Root is the system under test.** Humble Objects are verified indirectly through Integration and End-to-End Tests as part of a feature. The Composition Root may set up the test fixture, but it's never the system under test. Wanting to unit-test a Humble Object usually means it contains logic that belongs in the Core.
- **A Unit Test performs I/O other than to the local file system.** This usually means a Humble Object wasn't replaced by a Test Double - or hasn't been extracted yet.
- **The arrange phase is full of Test Doubles.** The test is likely aimed too low. Target the most abstract API of the slice instead, letting the real Core collaborators participate.
- **Unit Tests only cover the happy path.** Keeping the Core in memory makes error and edge cases cheap to test, and those are often the tests that catch real bugs.
- **A Test Double is named after the wrong kind.** A `FakeOrderSession` that returns hard-coded values is a Stub; one that records calls is a Spy. Accurate names tell the reader how the test uses it (see [Test Doubles](./automated-tests.mdx#test-doubles)).
- **A Unit Test starts a host.** Starting a host drags in the full framework pipeline and slows down the suite. Call the endpoint method directly in Unit Tests and leave pipeline verification to Integration Tests.
- **Unit Tests depend on each other or on their execution order.** Tests like this pass locally and fail randomly in CI. Give each test its own setup and data.
- **Integration or End-to-End Tests depend on each other without an explicit execution order.** A step-by-step scenario is fine when the order is declared explicitly in code; otherwise, test results depend on how the runner happens to schedule them.
- **An Integration or End-to-End Test repeats what other tests in the same context already cover.** Duplicate flows slow the suite down without telling you more. Merge them or move the variation into a Unit Test.
- **A third-party system is started per test or per test class.** Start each container once per test run and isolate each test's data instead.

## In the Composition Root

- **The container is accessed somewhere else.** Constructor injection keeps dependencies explicit; use an abstract factory when objects must be created at runtime.
- **Registrations happen after the container was built.** Modifying registrations at runtime makes object composition unpredictable. Stick to Register, Resolve, Release.
- **A Module registers types owned by another Module, or calls a Module that isn't its child.** This leads to duplicate registrations and order-dependent startup bugs (see [Modules](./composition-root.mdx#modules)).
- **A singleton captures a scoped dependency.** The singleton keeps the short-lived dependency alive past its intended lifetime, such as a database context outliving a request. Keep scope validation enabled in development to catch this early.
- **Configuration sources leak into the Core.** Bind configuration to plain options objects in the Composition Root so the Core doesn't depend on whether a setting came from a file or an environment variable.

## In Vertical Slices

- **The code of a feature is spread across technical folders.** `Services`, `Interfaces`, `Dtos`, and `Validators` folders obscure what the application does. Group files by feature instead.
- **Loose types accumulate in a parent folder.** More than seven shared files next to the Module make a parent folder hard to scan. Group related types into a sibling folder named after their concept, and move types used by only one child back down into that child.
- **A folder is named after a technical concern, like `Shared`, `Common`, or `Helpers`.** A folder of leftovers hides what the application does. Name the folder after the domain concept it represents, or move the files into the slices that use them.
- **Slices reference each other cyclically.** A cycle indicates shared logic that belongs to neither slice. Move it into a common parent or a new sibling folder.

## What is not a violation

Some patterns look suspicious if you come from stricter architectures, but they don't violate CHACK:

- **Tight coupling between Core types.** An endpoint calling its validator directly is exactly what CHACK recommends.
- **Core types that depend on framework or library types that run in memory** - including types from data access frameworks, like enums, value objects, or options types.
- **Core types that depend on a small, substitutable I/O abstraction provided by a framework, like a logger.**
- **Unit Tests for framework configuration and for pipes and filters that run in memory.** Serialization converters, O/R mapping configuration, and middleware without I/O belong to the Core and can be unit-tested like any other Core code.
- **A Test Double for a Core type** when the real collaborator would make a test unreasonably complex.
- **A folder that adapts a framework or library instead of representing a slice.** `DatabaseAccess` and `CompositionRoot` folders are fine.
- **An anemic or a rich domain model; Mediator, CQRS, Event Sourcing, or message buses.** All of them work with CHACK. CHACK sets the rules for where I/O happens and what tests target; how you design inside the categories is up to you.

:::tip[In .NET Practice]
[CHACK in .NET](./dotnet/index.md) names the .NET types behind these items, like the ones that perform I/O and the abstractions that make time testable.
:::
