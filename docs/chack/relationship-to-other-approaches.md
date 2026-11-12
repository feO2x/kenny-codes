---
sidebar_position: 10
title: Relationship to Other Approaches
---

# Relationship to Other Approaches

Nothing in CHACK is new. Every one of its four categories comes from a book, and the ideas behind them have been around for twenty years. What CHACK adds is a small, memorable set of categories that fits in your head while you are writing code, and a handful of rules attached to them.

If you already know one of the approaches below, this page helps you find your way around: what carries over, and where CHACK takes a different turn.

## Hexagonal Architecture / Ports and Adapters

This is CHACK's closest relative. Alistair Cockburn's [Hexagonal Architecture](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)) also puts an isolated application core in the middle, defines ports that the core owns, and pushes technology into adapters at the edge. CHACK's I/O abstractions are ports, and its Humble Objects are driven adapters.

There are three differences:

- **CHACK names tests as a category.** In Hexagonal Architecture, testability is the motivation. In CHACK, the test suite is one of the four things you build, with its own rules about what each kind of test aims at.
- **CHACK does not distinguish driving from driven adapters.** In Hexagonal Architecture, the code that receives an HTTP request is a primary adapter outside the hexagon. In CHACK, an endpoint that receives a deserialized DTO is Core: it runs in memory, it contains decisions, and that makes it the ideal target for Unit Tests. The framework that receives the request does the I/O, and the route mapping belongs to the Composition Root.
- **CHACK's ports are shaped per feature.** An I/O abstraction is designed for exactly one consumer, usually one vertical slice, so each feature gets the port it needs instead of sharing one `OrderPort` with all the others.

## Clean Architecture and Onion Architecture

[Clean Architecture](https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/) and Jeffrey Palermo's Onion Architecture share the same dependency rule: source dependencies point inwards, towards the domain. CHACK agrees, and chapter 23 of Clean Architecture describes Humble Objects at the process boundary in almost the same terms.

The difference lies in how much structure you build. Clean Architecture describes concentric layers - entities, use cases, interface adapters, frameworks - and in practice, teams often turn each ring into a project, with mapping code between them. CHACK has four categories and no rings, and it encourages you to keep the number of projects small. If layers help your application, you can still add them. CHACK just doesn't require them, so a value can travel from the request to the database without being copied into a new DTO at every ring.

This is a deliberate choice. Too much abstraction makes code just as hard to follow as too little, and layers applied by default are a common way to end up there.

## Domain-Driven Design

[Domain-Driven Design](https://www.oreilly.com/library/view/domain-driven-design-tackling/0321125215/) is where the isolated domain, the ubiquitous language, and the patterns that populate a Core come from. CHACK borrows most of it and leaves the bigger commitments up to you.

You can use entities, value objects, aggregates, domain events, and bounded contexts - or none of them, with plain services over an anemic model. Both fit inside the Core box. What CHACK cares about is that the domain vocabulary shows up in your type names, and that the domain doesn't need to know how it is persisted.

The one pattern CHACK replaces is the **Repository**. In DDD, a Repository gives each aggregate a collection-like interface, and in many codebases it grows into one abstraction per entity that collects every operation any feature ever needed. CHACK gives each feature its own [Client or Session](./clients-and-sessions.md) instead, shaped by what that feature needs. Your aggregates and their invariants stay exactly as they are; only the abstraction that loads and saves them follows the features instead of the data.

## Vertical Slice Architecture

Jimmy Bogard's [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/) organizes code by feature and minimizes coupling between slices. CHACK uses it for [organizing folders](./vertical-slices.md) and adds something that Vertical Slice Architecture deliberately leaves open: within a slice, the four categories still apply. Having everything in one folder makes a feature easy to find, and keeping its business rules apart from its I/O keeps it easy to test.

## The classic three-layer architecture

The traditional presentation / business logic / data access split looks superficially similar and differs in the one place that matters: the direction of the dependency. In a classic three-layer application, the business layer references the data access layer directly and calls into it. This is the coupling CHACK avoids, because it makes business logic impossible to test without a database.

Once you invert that dependency - the business logic owns the abstraction, and the data access implements it - you are most of the way to a CHACK application.

## Functional Core, Imperative Shell

Gary Bernhardt's [Functional Core, Imperative Shell](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell) reaches the same destination from the functional side: pure, decision-making code in the middle, effectful code at the edge, tests concentrated where the purity is.

CHACK's Core doesn't have to be pure - it may mutate state, and it usually does. It also calls I/O, just never directly. But the idea is the same: effects move to the boundary, decisions stay where they can be exercised in memory, and the effectful shell is verified by reviews and Integration Tests rather than by Unit Tests.

## Patterns CHACK leaves to you

People often ask about these, so here they are in one place. All of them work with CHACK, and none of them are required:

- **Mediator / request-handler pipelines.** The handler is an endpoint and belongs to the Core; pipeline behaviors that run in memory are Core, too.
- **CQRS.** Commands typically use Sessions, queries typically use Clients, and both sides keep their logic in the Core.
- **Event Sourcing.** The event store is a third-party system behind a Humble Object like any other.
- **Message buses.** Message handlers are endpoints, and sending a message goes through a Client.
- **Microservices, modular monoliths, single processes.** CHACK describes the inside of one application. How many of them you run is a different decision, and it does not change anything on these pages.

## What CHACK actually claims

If you boil CHACK down, three rules remain:

1. Every piece of code belongs to exactly one of the four categories.
2. The Core never performs I/O itself. Every I/O call goes through an abstraction that the Core owns, implemented by a Humble Object that does nothing but perform the call and map the data.
3. Every test belongs to exactly one test category, and neither a Humble Object nor the Composition Root is ever the system under test.

Everything else on these pages builds on them.
