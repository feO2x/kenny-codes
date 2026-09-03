---
sidebar_position: 8
title: Reviewing for CHACK
---

# Reviewing for CHACK

CHACK is easy to state and easy to erode. Nobody sets out to put a SQL query in a domain entity; it happens one convenient shortcut at a time, usually late in a sprint. This page is the checklist I use in code reviews - and the one I run over an unfamiliar codebase to find out how much of the model is still intact.

## The one question

Open any file and ask: **which of the four categories does this belong to?**

- Core
- Humble Object
- Automated Test
- Composition Root

If the answer is "two of them", you have found the thing worth discussing. That is the entire review technique; everything below is a list of the ways the answer comes out wrong.

## Violations in the Core

- **An I/O type appears in a Core file.** A database context, an HTTP client, a connection, a file API, a broker client, a socket. Anything that can block on something outside the process.
- **Framework attributes on domain types.** Serialization or O/R mapping attributes mean the domain model knows how it is stored or transmitted. Move that knowledge to configuration next to the data access code.
- **A DI container in a constructor.** Service Locator in disguise. The dependencies are now invisible to the compiler, to the reader, and to the test.
- **`DateTime.Now`, `Guid.NewGuid()`, `Random`, `Environment.MachineName`.** Ambient state read straight from the environment makes the Core non-deterministic and its tests flaky. Abstract it.
- **Mutable static state.** Shared, invisible coupling. It breaks test isolation and creates race conditions that only show up in production.
- **An interface with exactly one implementation and no test double behind it.** Not always wrong, but always worth a question. If nothing varies, the indirection is costing readability and buying nothing.
- **A file that is thousands of lines long.** Spaghetti code does not announce itself; it accumulates. Ask what the type actually does, and count the answers.

## Violations in humble objects

- **Branches and loops.** An `if` that is not a null check is usually a decision, and decisions belong in the Core, where they can be tested.
- **Validation.** A humble object returns data; the Core decides whether the data is acceptable.
- **Calculation, formatting, business rules.** Anything you would want a test for.
- **Mapping that has grown big enough to need a test.** That is the signal to extract it into a public static method in the Core and call it from the humble object.
- **`IQueryable<T>` or another deferred query type escaping the boundary.** Then the SQL is composed in the Core and executed nowhere in particular, and no test double can reproduce the behaviour honestly.
- **A humble object talking to two different third-party systems.** Split it. One humble object, one system, one context, maybe one transaction.
- **Undisposed resources.** If the humble object holds a connection, a client, or a stream, it must be disposable, and the Composition Root must own its lifetime.
- **Logic in the view.** UI code is a humble object too: multi-bindings with rules in them, converters that decide things, logic in printed reports - all of that is testable code sitting where it cannot be easily tested.

## Violations in tests

- **The system under test is a humble object or part of the Composition Root.** Unit tests target the Core. If you feel the need to unit-test a humble object, it is doing too much.
- **A unit test performs real I/O.** The local file system is the one accepted exception. Everything else means a humble object was not doubled - or does not exist yet.
- **A forest of test doubles in the arrange phase.** The test is aimed too low. Move it up to the most abstract API of the slice and let the real collaborators participate.
- **Tests that depend on execution order or on each other's leftovers.** They pass locally, fail in the pipeline, and get marked as "flaky, just re-run it".
- **Assertions that cannot fail.** Delete a statement from the production code or invert a condition, and check that something turns red. Assertions that only verify "did not throw" usually do not.
- **Tests that only cover the happy path.** The reason the Core is isolated from I/O is that error and edge cases become cheap to test. If nobody is testing them, the model is paying for itself and not being used.

## Violations in the Composition Root

- **Container access outside the Composition Root.** Use constructor injection, or an abstract factory when objects must be created at runtime.
- **Registrations happening after the container was built.** Register, then resolve, then release. Configuring the container later means the composition depends on runtime order.
- **A singleton capturing a scoped dependency.** The classic lifetime bug: a long-lived object pins a short-lived one, and the database context outlives the request.
- **Reflection-driven convention magic.** The Composition Root is not covered by tests, so readability is the safety net. If a reviewer cannot tell what gets registered, neither can the next maintainer.
- **Configuration knowledge in the Core.** Bind configuration here, hand the Core plain settings objects.

## What is not a violation

Just as important, so that reviews stay useful:

- **Tight coupling inside the Core.** An endpoint calling its validator directly is correct, not a missing abstraction.
- **A test double for something that is not a humble object.** Uncommon, but legitimate when a real collaborator would make the test unreasonably complicated.
- **A folder that is not a vertical slice.** Framework requirements are real. `DatabaseAccess` and `CompositionRoot` folders are fine.
- **An anemic domain model - or a rich one.** CHACK does not take a side.
- **Mediator, CQRS, event sourcing, a message bus.** All compatible. CHACK constrains where I/O happens and where tests point, not how you design the Core.
