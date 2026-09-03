---
sidebar_position: 9
title: Relationship to Other Approaches
---

# Relationship to Other Approaches

Nothing in CHACK is new. Every one of its four categories comes from a book, and the ideas behind them have been circulating for twenty years. What CHACK adds is a small, memorable set of categories that fits in your head while you are writing code, with exactly one hard rule attached to it.

This page places it next to the approaches people usually compare it with.

## Hexagonal Architecture / Ports and Adapters

The closest relative. Alistair Cockburn's [Hexagonal Architecture](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)) also puts an isolated application core in the middle, defines ports that the core owns, and pushes technology into adapters at the edge. CHACK's I/O abstractions are ports, and its humble objects are driven adapters.

Two differences:

- **CHACK names tests as a category.** In Hexagonal Architecture, testability is the motivation; in CHACK, the test suite is one of the four things you are building, with its own rules about what may point where.
- **CHACK does not distinguish driving from driven adapters.** In Hexagonal Architecture, the code that receives an HTTP request is a primary adapter outside the hexagon. In CHACK, an endpoint that receives a deserialized DTO is Core - it runs in memory, it contains decisions, and it is exactly where unit tests should aim. Only the part that genuinely touches the framework boundary is humble.

## Clean Architecture and Onion Architecture

[Clean Architecture](https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/) and Jeffrey Palermo's Onion Architecture share the same dependency rule: source dependencies point inwards, towards the domain. CHACK agrees, and chapter 23 of Clean Architecture describes humble objects at the process boundary in almost the same terms.

The difference is how much structure you get told to build. Clean Architecture prescribes concentric layers - entities, use cases, interface adapters, frameworks - and in practice teams turn each ring into a project with mapping between them. CHACK has four categories and no rings. If layering earns its keep in your application, add it; CHACK will not object. But it will not ask you to write four DTOs for one value on the way in.

That restraint is deliberate. Excessive abstraction is a failure mode CHACK is explicitly trying to avoid, and rigidly applied layered architectures are one of its most common causes.

## Domain-Driven Design

[Domain-Driven Design](https://www.oreilly.com/library/view/domain-driven-design-tackling/0321125215/) is where the isolated domain, the ubiquitous language, and the patterns that populate a Core come from. CHACK borrows all of it and stays neutral on the parts that are a bigger commitment.

Use entities, value objects, aggregates, repositories, domain events, bounded contexts - or use none of them and write plain services over an anemic model. Both fit inside the Core box. What CHACK insists on is that the domain vocabulary shows up in your type names and that the domain does not know how it is persisted.

## The classic three-layer architecture

The traditional presentation / business logic / data access split looks superficially similar and differs in the one place that matters: the direction of the dependency. In a classic three-layer application, the business layer references the data access layer directly and calls into it. That is exactly the coupling CHACK rejects, because it is what makes business logic impossible to test without a database.

Invert that dependency - let the business logic own the abstraction and the data access implement it - and a three-layer application becomes a CHACK application.

## Functional Core, Imperative Shell

Gary Bernhardt's [Functional Core, Imperative Shell](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell) reaches the same destination from the functional side: pure, decision-making code in the middle, effectful code at the edge, tests concentrated where the purity is.

CHACK's Core is not required to be pure - it may mutate state, and it usually does. But the instinct is identical: push effects to the boundary, keep decisions where they can be exercised in memory, and accept that the effectful shell will be verified by review and integration tests rather than by unit tests.

## Patterns CHACK leaves to you

These come up often enough to state explicitly. All of them are compatible; none of them are required:

- **Mediator / request-handler pipelines.** Fine. The handler is Core.
- **CQRS.** Fine. Read and write models are both Core; their sessions are both humble objects.
- **Event sourcing.** Fine. The event store is behind a humble object like any other third-party system.
- **Vertical slices.** Not part of CHACK, but strongly favoured - see [Vertical Slices](./vertical-slices.md).
- **Microservices, modular monoliths, single processes.** CHACK describes the inside of one process. How many processes you run is a different decision, and it does not change anything on these pages.

## What CHACK actually claims

Strip it down and there are two rules:

1. Every I/O call leaves the process through a humble object behind an abstraction that the Core owns.
2. The Core is covered by fast, in-memory tests, and the system under test of those tests is always in the Core.

Everything else on this site is advice. Those two are the model.
