---
sidebar_position: 9
title: Reviewing for CHACK
---

# Reviewing for CHACK

CHACK is easy to state and easy to erode. Nobody sets out to put a SQL query in a domain entity; it happens one convenient shortcut at a time, usually late in a sprint. This page collects what I look for in code reviews - and when I get to know an unfamiliar codebase and want to find out how much of the model is still intact.

## The one question

Open any file and ask: **Which of the four categories does this exclusively belong to?**

- Core
- Humble Objects
- Automated Tests
- Composition Root

Most of the time, the answer comes quickly. When it turns out to be "two of them", you have found something worth talking about, and usually the way forward is to split the code. Everything below describes the situations in which this happens most often, so that you recognize them when you see them.

## In the Core

- **A type that performs I/O shows up.** A database context, an HTTP client, a connection, a file API, a broker client - anything that waits on something outside the process. Once it's there, the code can no longer run in memory, and its tests need a real third-party system. An I/O abstraction owned by the Core brings that back. Small, substitutable framework abstractions like a logger are fine as they are.
- **Domain types or DTOs carry framework attributes.** Serialization, O/R mapping, or DI container attributes mean that the type knows how it is stored, transmitted, or composed. Moving that knowledge into separate configuration types or into the Composition Root keeps the type focused on the domain.
- **The DI container is injected.** The type now fetches its own dependencies, so neither the compiler, nor the reader, nor the test can see what it actually needs. If the type has to create objects at runtime, an abstract factory gives it that ability and keeps the dependencies visible.
- **The current time, new GUIDs, or random numbers are obtained directly.** `DateTime.UtcNow`, `Guid.NewGuid()`, and `Random` give a different result on every run, and so do the tests that touch them. Getting these values through an abstraction like `TimeProvider` lets the tests decide what they are.
- **Mutable static state is used.** It couples code in ways nobody can see, breaks test isolation, and can lead to race conditions that only show up in production. Context objects passed via dependency injection do the same job openly.
- **An abstraction has a single implementation and no Test Double behind it.** This is not necessarily wrong, but it's worth asking what it's for. If nothing varies, the code becomes easier to follow without the indirection.

## In Humble Objects

- **Branches, loops, validation, or business rules appear.** An `if` that is neither a precondition check nor part of the mapping is usually a decision. In the Core, that decision could be covered by a Unit Test; in the Humble Object, only by slower Integration Tests.
- **Mapping has grown to the point where you'd like to test it.** If it can run in memory, moving it into a static method in the Core makes that test possible. The Humble Object then simply calls it.
- **A read-only Humble Object is called a Session.** If the Core cannot commit through it, it's a [Client](./clients-and-sessions.md), and the name helps readers know what to expect.
- **A deferred query leaves the Humble Object.** When an `IQueryable<T>` or a similar type escapes, the query is composed in the Core and executed somewhere further away, and no Test Double can reproduce that faithfully. Materializing the results inside the Humble Object keeps the I/O in one place.
- **Two third-party systems are accessed.** Splitting the Humble Object into one per system keeps each of them simple, and each one can be replaced on its own in tests.
- **One abstraction serves several features, like a Repository.** Every feature then depends on members it doesn't need, and transaction boundaries become hard to see. Giving each slice its own abstraction and sharing implementation code via static methods keeps the benefits without the coupling, see [Clients and Sessions](./clients-and-sessions.md#one-per-slice-not-one-per-entity).
- **Resources are not disposed.** If the Humble Object owns a connection, a client, a stream, or a file handle, making it disposable and letting the Composition Root manage its lifetime ensures the resource is released reliably.
- **The view contains logic.** UI code is a Humble Object, too. Multi-bindings with rules in them, converters that make decisions, or logic in printed reports are all testable code in a place where testing is hard. Moved out of the view, the same code can be covered by Unit Tests.

## In Automated Tests

- **A Humble Object or the Composition Root is the system under test.** Humble Objects are verified indirectly by Integration and End-to-End Tests, as part of a feature. The Composition Root may help set up a test, but it is never what the test aims at. A wish to unit-test a Humble Object is usually a hint that it contains logic that belongs in the Core.
- **A Unit Test performs I/O other than to the local file system.** This usually means a Humble Object was not replaced by a Test Double - or that it doesn't exist yet.
- **The arrange phase is full of Test Doubles.** The test is probably aimed too low. Moving it up to the most abstract API of the slice lets the real Core collaborators take part, and most of the Test Doubles disappear.
- **Unit Tests only cover the happy path.** Isolating the Core from I/O is what makes error and edge cases cheap to test. They are often where the most valuable tests are.
- **A Test Double is named after the wrong kind.** A `FakeOrderSession` that returns hard-coded answers is a Stub; one that records calls is a Spy. An accurate name tells the reader how the test uses it, see [Test Doubles](./automated-tests.mdx#test-doubles).
- **Tests depend on each other or on their execution order.** Such tests tend to pass locally and fail in the pipeline. Giving each test its own data and setup makes them reliable again.

## In the Composition Root

- **The container is accessed somewhere else.** Constructor injection keeps dependencies visible; an abstract factory helps when objects must be created at runtime.
- **Registrations happen after the container was built.** The composition then depends on what happens at runtime. Following Register, Resolve, Release keeps it predictable.
- **A Module registers types owned by another Module, or calls a Module that is not its child.** Types end up registered several times, and the result depends on the order in which the Modules run. [Modules](./composition-root.mdx#modules) describes how to avoid this.
- **A singleton captures a scoped dependency.** The long-lived object keeps the short-lived one alive, for example a database context that outlives its request. Scope validation in development helps to catch this early.
- **Configuration sources leak into the Core.** When configuration is bound to options objects in the Composition Root, the Core receives plain settings and doesn't need to know whether a value came from a file or an environment variable.

## In Vertical Slices

- **The code of a feature is spread across technical folders.** `Services`, `Interfaces`, `Dtos`, and `Validators` folders hide what the application does. Grouping by feature brings it back into view.
- **Loose types accumulate in a parent folder.** Types that belong to a concept feel at home in a sibling folder named after it, and types that only one child uses can move down into that child.
- **Slices reference each other cyclically.** The cycle shows that some code belongs to neither slice. Moving it into a common parent or a new sibling folder resolves it.

## What is not a violation

It's just as helpful to know what you don't need to worry about:

- **Tight coupling between Core types.** An endpoint calling its validator directly is exactly what CHACK suggests.
- **Core types that depend on framework or library types that run in memory** - including types of data access frameworks, like enums, value objects, or options types.
- **Core types that depend on a small, substitutable framework abstraction like `ILogger<T>`.**
- **Unit Tests for framework configuration and for pipes and filters that run in memory.** Serialization converters, O/R mapping configuration, and middleware without I/O are Core, and can be tested like Core.
- **A Test Double for a Core type** when the real collaborator would make the test unreasonably complicated.
- **A folder that adapts a framework or library instead of representing a slice.** `DatabaseAccess` and `CompositionRoot` folders are fine.
- **An anemic or a rich domain model; Mediator, CQRS, Event Sourcing, or message buses.** CHACK is happy with all of them. It cares about where I/O happens and what tests aim at, not about how you design within the categories.
