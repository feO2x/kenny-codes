---
sidebar_position: 10
title: Relationship to Other Approaches
image: /img/social-cards/docs-chack-relationship-to-other-approaches.jpg
---

# Relationship to Other Approaches

Nothing in CHACK is brand new. Every one of its four categories comes from an established book, and the underlying ideas have been around for over twenty years. CHACK distills them into four memorable categories and a short set of rules you can keep in your head while writing code.

If you already know one of the approaches below, this comparison shows what carries over and where CHACK differs.

## Hexagonal Architecture / Ports and Adapters

This is CHACK's closest relative. Alistair Cockburn's [Hexagonal Architecture](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)) also puts an isolated application core in the middle, defines ports owned by the core, and pushes technology into adapters at the edge. CHACK's I/O abstractions correspond to ports, and its Humble Objects correspond to driven adapters.

There are three differences:

- **CHACK makes tests a first-class category.** In Hexagonal Architecture, testability is the motivation. In CHACK, the test suite is one of the four categories you build, with explicit rules about what each kind of test targets.
- **CHACK does not separate driving from driven adapters.** In Hexagonal Architecture, the code that receives an HTTP request is a primary adapter outside the hexagon. In CHACK, an endpoint receiving a deserialized DTO belongs to the Core: it runs in memory, contains decisions, and makes the best target for Unit Tests. The framework handles the incoming network I/O, and route mapping belongs to the Composition Root.
- **CHACK's ports are scoped per feature.** Each I/O abstraction is designed for one consumer, usually a single vertical slice, rather than sharing a broad `OrderPort` across unrelated features.

## Clean Architecture and Onion Architecture

[Clean Architecture](https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/) and Jeffrey Palermo's Onion Architecture share the same dependency rule: source dependencies point inward toward the domain. CHACK agrees, and chapter 23 of Clean Architecture describes Humble Objects at the process boundary in very similar terms.

The difference is how much ceremony you take on. Clean Architecture defines concentric rings (entities, use cases, interface adapters, frameworks), and teams frequently turn each ring into a separate project with mapping boilerplate between them. CHACK has four categories, no rings, and encourages keeping the number of projects small. You can still add layers where they genuinely help, but CHACK does not require copying a value into a new DTO at every boundary.

Omitting mandatory rings is deliberate: adding layers by default is one of the fastest ways to end up with excessive abstraction.

## Domain-Driven Design

[Domain-Driven Design](https://www.oreilly.com/library/view/domain-driven-design-tackling/0321125215/) is the source of the isolated domain, the ubiquitous language, and the building blocks of a rich Core. CHACK builds on those ideas without forcing you to adopt all of tactical or strategic DDD.

You can use entities, value objects, aggregates, domain events, and bounded contexts - or stick to plain services over an anemic model. Both fit inside the Core. What matters in CHACK is that your domain vocabulary appears in your type names and that domain types stay free of persistence concerns.

The one DDD pattern CHACK replaces is the **Repository**. In DDD, a Repository gives each aggregate a collection-like interface, which in many codebases grows into a wide entity-level interface holding every operation any feature has ever needed. CHACK uses per-feature [Clients and Sessions](./clients-and-sessions.md) instead. Your aggregates and invariants stay intact; only the data-access abstraction follows the features rather than the tables.

## Vertical Slice Architecture

CHACK's [Vertical Slices](./vertical-slices.md) and Jimmy Bogard's [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/) share a name and an organizing principle, but they answer different questions.

What they have in common:

- **Code is organized around features** rather than technical layers.
- **Coupling stays low between slices and high within a slice.** As Bogard puts it: "Minimize coupling between slices, and maximize coupling in a slice."
- **No shared entity Repositories or monolithic services across features.** Adding a new feature adds new code instead of modifying code other features depend on.
- **Start simple.** Introduce a service or a richer domain model only when complexity justifies it.
- **Both pair well with CQRS and the Mediator pattern.**

Where they differ:

- **Scope.** Vertical Slice Architecture is a full architectural style where each request decides how to handle itself, including how it accesses data. CHACK's Vertical Slices only organize folders; the four categories still govern what goes where inside every slice.
- **I/O.** In Vertical Slice Architecture, a slice may call its data-access tools directly, such as an O/R mapper's Unit of Work. In CHACK, every I/O call goes through a Core-owned abstraction so the business rules of every slice can be unit-tested in memory.
- **Structure.** Bogard leaves folder conventions open. CHACK adds explicit rules for nesting slices, sharing code between them, registering types via Modules, and mirroring slice folders in test projects.
- **Required or not.** CHACK works with any folder layout. Its per-feature abstractions come from the [Interface Segregation Principle](https://www.cs.utexas.edu/~fares/papers/ISP.pdf) rather than from folder conventions: an abstraction is tailored to one consumer, which usually happens to be a vertical slice. Vertical Slices make that structure visible, so CHACK recommends them.

## The classic three-layer architecture

The traditional presentation / business logic / data access split looks similar on the surface, but differs where it counts: dependency direction. In a classic three-layer app, the business layer references the data access layer directly, making it impossible to test business logic without a database.

Once you invert that dependency - letting the business logic own the abstraction and the data access layer implement it - you are already most of the way to CHACK.

## Functional Core, Imperative Shell

Gary Bernhardt's [Functional Core, Imperative Shell](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell) arrives at the same separation from the functional programming side: pure decision-making code in the center, side effects at the edge, and tests concentrated on the pure core.

CHACK's Core does not have to be functionally pure - it may mutate state, and in object-oriented code it usually does. It also triggers I/O through abstractions. Still, the principle matches: push I/O to the boundary, keep decisions in memory where Unit Tests can reach them, and cover the boundary with code reviews and Integration Tests.

## Patterns CHACK leaves to you

The patterns below come up frequently in discussions about CHACK. All of them work well with CHACK, and none are required:

- **Mediator / request-handler pipelines.** The handler is an endpoint in the Core, and in-memory pipeline behaviors belong to the Core, too.
- **CQRS.** Commands typically use Sessions, queries typically use Clients, and both sides keep their logic in the Core.
- **Event Sourcing.** The event store is a third-party system behind a Humble Object like any other.
- **Message buses.** Message handlers are endpoints, and publishing a message goes through a Client.
- **Microservices, modular monoliths, single processes.** CHACK describes the structure inside one application. How many deployable services you run is a separate decision and does not change these rules.

## What CHACK actually claims

At its core, CHACK comes down to three rules:

1. Every piece of code belongs to exactly one of the four categories.
2. The Core never performs I/O itself. Every I/O call goes through an abstraction owned by the Core, implemented by a Humble Object that only performs the call and maps the data.
3. Every test belongs to exactly one test category, and neither a Humble Object nor the Composition Root is ever the system under test.
