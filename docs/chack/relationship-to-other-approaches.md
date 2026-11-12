---
sidebar_position: 10
title: Relationship to Other Approaches
---

# Relationship to Other Approaches

Nothing in CHACK is new. Every one of its four categories comes from a book, and the ideas behind them have been around for twenty years. What CHACK adds is a small, memorable set of categories that fits in your head while you are writing code, and a handful of hard rules attached to them.

This page places it next to the approaches people usually compare it with.

## Hexagonal Architecture / Ports and Adapters

The closest relative. Alistair Cockburn's [Hexagonal Architecture](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)) also puts an isolated application core in the middle, defines ports that the core owns, and pushes technology into adapters at the edge. CHACK's I/O abstractions are ports, and its Humble Objects are driven adapters.

Three differences:

- **CHACK names tests as a category.** In Hexagonal Architecture, testability is the motivation; in CHACK, the test suite is one of the four things you are building, with its own rules about what each kind of test aims at.
- **CHACK does not distinguish driving from driven adapters.** In Hexagonal Architecture, the code that receives an HTTP request is a primary adapter outside the hexagon. In CHACK, an endpoint that receives a deserialized DTO is Core - it runs in memory, it contains decisions, and it is exactly where Unit Tests should aim. The framework that receives the request does the I/O, and the route mapping belongs to the Composition Root.
- **CHACK's ports are shaped per feature.** An I/O abstraction is designed for exactly one consumer, usually one vertical slice. There is no `OrderPort` that every feature shares.

## Clean Architecture and Onion Architecture

[Clean Architecture](https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/) and Jeffrey Palermo's Onion Architecture share the same dependency rule: source dependencies point inwards, towards the domain. CHACK agrees, and chapter 23 of Clean Architecture describes Humble Objects at the process boundary in almost the same terms.

The difference is how much structure you are told to build. Clean Architecture prescribes concentric layers - entities, use cases, interface adapters, frameworks - and in practice teams turn each ring into a project with mapping between them. CHACK has four categories and no rings, and it encourages you to keep the number of projects small. If layering earns its keep in your application, add it; CHACK will not object. But it will not ask you to write four DTOs for one value on the way in.

That restraint is deliberate. Excessive abstraction is a failure mode CHACK is explicitly trying to avoid, and rigidly applied layered architectures are one of its most common causes.

## Domain-Driven Design

[Domain-Driven Design](https://www.oreilly.com/library/view/domain-driven-design-tackling/0321125215/) is where the isolated domain, the ubiquitous language, and the patterns that populate a Core come from. CHACK borrows most of it and stays neutral on the parts that are a bigger commitment.

Use entities, value objects, aggregates, domain events, and bounded contexts - or use none of them and write plain services over an anemic model. Both fit inside the Core box. What CHACK insists on is that the domain vocabulary shows up in your type names and that the domain does not know how it is persisted.

The one pattern CHACK replaces is the **Repository**. In DDD, a Repository gives each aggregate a collection-like interface, and in many codebases it grows into one abstraction per entity that collects every operation any feature ever needed. CHACK gives each feature its own [Client or Session](./clients-and-sessions.md) instead, shaped by what that feature needs. Aggregates and their invariants stay exactly as they are; only the abstraction that loads and saves them is cut along features instead of along data.

## Vertical Slice Architecture

Jimmy Bogard's [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/) organizes code by feature and minimizes coupling between slices. CHACK adopts this for [organizing folders](./vertical-slices.md) and adds what Vertical Slice Architecture deliberately leaves open: within a slice, the four categories still apply. A slice does not get to mix business rules and SQL in one handler just because everything lives in one folder.

## The classic three-layer architecture

The traditional presentation / business logic / data access split looks superficially similar and differs in the one place that matters: the direction of the dependency. In a classic three-layer application, the business layer references the data access layer directly and calls into it. That is exactly the coupling CHACK rejects, because it is what makes business logic impossible to test without a database.

Invert that dependency - let the business logic own the abstraction and the data access implement it - and you are most of the way to a CHACK application.

## Functional Core, Imperative Shell

Gary Bernhardt's [Functional Core, Imperative Shell](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell) reaches the same destination from the functional side: pure, decision-making code in the middle, effectful code at the edge, tests concentrated where the purity is.

CHACK's Core is not required to be pure - it may mutate state, and it usually does. It also calls I/O, just never directly. But the instinct is identical: push effects to the boundary, keep decisions where they can be exercised in memory, and accept that the effectful shell is verified by review and by Integration Tests rather than by Unit Tests.

## Patterns CHACK leaves to you

These come up often enough to state explicitly. All of them are compatible; none of them are required:

- **Mediator / request-handler pipelines.** Fine. The handler is an endpoint and belongs to the Core; pipeline behaviors that run in memory are Core, too.
- **CQRS.** Fine. Commands typically use Sessions, queries typically use Clients, and both sides keep their logic in the Core.
- **Event Sourcing.** Fine. The event store is a third-party system behind a Humble Object like any other.
- **Message buses.** Fine. Message handlers are endpoints; sending a message goes through a Client.
- **Microservices, modular monoliths, single processes.** CHACK describes the inside of one application. How many of them you run is a different decision, and it does not change anything on these pages.

## What CHACK actually claims

Strip it down and three rules remain:

1. Every piece of code belongs to exactly one of the four categories.
2. The Core never performs I/O itself. Every I/O call goes through an abstraction that the Core owns, implemented by a Humble Object that does nothing but perform the call and map the data.
3. Every test belongs to exactly one test category, and neither a Humble Object nor the Composition Root is ever the system under test.

Everything else on this site refines these three rules.
