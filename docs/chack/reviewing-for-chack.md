---
sidebar_position: 9
title: Reviewing for CHACK
---

# Reviewing for CHACK

CHACK is easy to state and easy to erode. Nobody sets out to put a SQL query in a domain entity; it happens one convenient shortcut at a time, usually late in a sprint. This page is the checklist I use in code reviews - and the one I run over an unfamiliar codebase to find out how much of the model is still intact.

## The one question

Open any file and ask: **Which of the four categories does this exclusively belong to?**

- Core
- Humble Objects
- Automated Tests
- Composition Root

If the answer is "two of them", you have found the thing worth discussing: the code needs to be split. That is the entire review technique. Everything below is a list of the ways the answer typically comes out wrong.

## Violations in the Core

- **A type that performs I/O is referenced.** A database context, an HTTP client, a connection or command, a file API, a broker client. Anything that can block on something outside the process. Small, substitutable framework abstractions like a logger are the exception.
- **Framework attributes on domain types or DTOs.** Serialization, O/R mapping, or DI container attributes mean the type knows how it is stored, transmitted, or composed. Configure that in separate types or in the Composition Root.
- **The DI container is injected.** Service Locator in disguise. The dependencies are now invisible to the compiler, to the reader, and to the test. Use an abstract factory when objects must be created at runtime.
- **The current time, new GUIDs, or random numbers are obtained directly.** `DateTime.UtcNow`, `Guid.NewGuid()`, and `Random` make the Core non-deterministic and its tests flaky. Get them through an abstraction like `TimeProvider`.
- **Mutable static state.** Shared, invisible coupling. It breaks test isolation and creates race conditions that only show up in production.
- **An abstraction with a single implementation and no Test Double behind it.** Not always wrong, but always worth a question. If nothing varies, the indirection costs readability and buys nothing.

## Violations in Humble Objects

- **Branches, loops, validation, or business rules.** An `if` that is neither a precondition check nor part of the mapping is a decision, and decisions belong in the Core, where they can be tested.
- **Mapping that needs tests and could run in memory.** That is the signal to move it into a static method in the Core and call it from the Humble Object.
- **A read-only Humble Object that is called a Session.** If the Core cannot commit through it, it is a [Client](./clients-and-sessions.md).
- **Deferred queries escape.** An `IQueryable<T>` or a similar type that leaves the Humble Object means the query is composed in the Core and executed nowhere in particular. No Test Double can reproduce that faithfully.
- **Two third-party systems are accessed.** Split it. One Humble Object talks to one third-party system.
- **A single abstraction serves several features, like a Repository.** Every consumer depends on members it does not need, and the transaction boundaries blur. Give each slice its own abstraction and share implementation code via static methods.
- **Resources are not disposed.** If the Humble Object owns a connection, a client, a stream, or a file handle, it must be disposable, and the Composition Root must manage its lifetime.
- **Logic in the view.** UI code is a Humble Object, too: multi-bindings with rules in them, converters that decide things, logic in printed reports - all of that is testable code sitting where it cannot be easily tested.

## Violations in Automated Tests

- **A Humble Object or the Composition Root is the system under test.** No test aims at them directly. Humble Objects are verified indirectly by Integration and End-to-End Tests. The Composition Root may be part of a fixture, but never the target.
- **A Unit Test performs I/O other than to the local file system.** Everything else means a Humble Object was not replaced - or does not exist yet.
- **A forest of Test Doubles in the arrange phase.** The test is aimed too low. Move it up to the most abstract API of the slice and let the real Core collaborators participate.
- **Unit Tests only cover the happy path.** The reason the Core is isolated from I/O is that error and edge cases become cheap to test. If nobody tests them, the model costs effort without paying off.
- **A Test Double is named after the wrong kind.** A class called `FakeOrderSession` that returns hard-coded answers is a Stub; one that records calls is a Spy. The name tells the reader how the test uses it, see [Test Doubles](./automated-tests.mdx#test-doubles).
- **Tests depend on each other or on their execution order.** They pass locally, fail in the pipeline, and get marked as "flaky, just re-run it".

## Violations in the Composition Root

- **The container is accessed elsewhere.** Use constructor injection, or an abstract factory when objects must be created at runtime.
- **Registrations happen after the container was built.** Register, then resolve, then release. Configuring the container later makes the composition depend on runtime order.
- **A Module registers types owned by another Module, or calls a Module that is not its child.** Types end up registered several times, and the result depends on the order in which the Modules run. See [Modules](./composition-root.mdx#modules).
- **A singleton captures a scoped dependency.** The classic lifetime bug: a long-lived object pins a short-lived one, and the database context outlives the request.
- **Configuration sources leak into the Core.** Bind configuration to options objects in the Composition Root and hand the Core plain settings. The Core should not know that a value came from an environment variable.

## Violations in Vertical Slices

- **A feature's code is scattered across technical folders.** `Services`, `Interfaces`, `Dtos`, and `Validators` folders hide what the application does.
- **A parent folder accumulates loose types.** Types that belong to a concept go into a sibling folder named after it; types that only one child uses move down into that child.
- **Slices reference each other cyclically.** Move the shared code into a common parent or a new sibling folder.

## What is not a violation

Just as important, so that reviews stay useful:

- **Tight coupling between Core types.** An endpoint calling its validator directly is correct, not a missing abstraction.
- **Core types that depend on framework or library types that run in memory** - including types of data access frameworks, like enums, value objects, or options types.
- **Core types that depend on a small, substitutable framework abstraction like `ILogger<T>`.**
- **Unit Tests for framework configuration and for pipes and filters that run in memory.** Serialization converters, O/R mapping configuration, and middleware without I/O are Core and may be tested like Core.
- **A Test Double for a Core type** when the real collaborator would make the test unreasonably complicated.
- **A folder that adapts a framework or library instead of representing a slice.** `DatabaseAccess` and `CompositionRoot` folders are fine.
- **An anemic or a rich domain model; Mediator, CQRS, Event Sourcing, or message buses.** CHACK does not take a side. It constrains where I/O happens and what tests aim at, not how you design within the categories.
