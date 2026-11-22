---
sidebar_position: 7
title: Building Blocks of a Backend Feature
description: "The building blocks you meet in every backend feature, such as endpoints, DTOs, and validators, and the CHACK category each one belongs to."
image: /img/social-cards/docs-chack-building-blocks.jpg
---

# Building Blocks of a Backend Feature

## The building blocks

The four categories tell you where a piece of code belongs. When you build a backend feature - an HTTP endpoint or a message broker handler - you'll meet the same handful of building blocks again and again:

| Building Block         | Category         | Description |
|------------------------|------------------|-------------|
| Endpoint               | Core             | Called directly by a framework to handle a request or a message. It receives the deserialized Request DTO and returns the response, if there is one. It is the preferred system under test of Unit Tests. |
| Request / Response DTO | Core             | Inputs and outputs of an endpoint. Incoming DTOs are untrusted until they are validated. Make them immutable where possible. |
| Validator              | Core             | Validates an incoming DTO. Called directly by the endpoint or the service. It may also turn the validated DTO into domain objects, acting as an anti-corruption layer. |
| Service                | Core             | Contains the main, orchestrating business logic of a feature. Only introduce one when the logic would overload the endpoint. |
| Domain Model           | Core             | Entities, value objects, and aggregates. Often shared between slices. |
| Client                 | Humble Object    | Performs I/O calls to a third-party system without exposing transaction control to the Core. |
| Session                | Humble Object    | Performs I/O calls to a third-party system within a transaction controlled by the Core. |
| Module                 | Composition Root | Registers the building blocks of a slice with the DI container and calls the Modules of its child slices. |
| Test Double            | Automated Tests  | Replaces a dependency of the system under test in a test. |

Not every feature needs all of them. A feature without input has no Request DTO and no validator; a feature with little logic has no service; a feature that does not touch a third-party system has neither a Client nor a Session. Each building block you do write belongs to exactly one category, and the table tells you which.

Route definitions and message subscriptions belong to the [Composition Root](./composition-root.mdx) and usually live in the slice's Module.

### Validators as an anti-corruption layer

A validator can do more than return "valid" or "invalid". When it converts a valid DTO directly into domain objects, it acts as an anti-corruption layer (a term from Domain-Driven Design): external input formats, field names, and optional values stop at the validator, and everything behind it works with valid domain objects. The endpoint never deals with unchecked data, and the domain model stays decoupled from the request schema.

## A complete slice

Let's walk through a small feature that adds an item to a to-do list. Organized as a [vertical slice](./vertical-slices.md), it looks like this:

```text
📁 WebApp
|- 📁 CompositionRoot
|- 📁 DatabaseAccess
|- 📁 ToDoItems
   |- 📁 AddToDoItem
   |  |- 📄 AddToDoItemEndpoint
   |  |- 📄 AddToDoItemModule
   |  |- 📄 AddToDoItemSession
   |  |- 📄 NewToDoItemDto
   |  |- 📄 NewToDoItemDtoValidator
   |  |- 📄 SqlAddToDoItemSession
   |- 📄 ToDoItem
   |- 📄 ToDoItemsModule
```

`ToDoItem` sits in the parent folder because other slices under `ToDoItems` use it as well. `DatabaseAccess` is a [folder that is not a slice](./vertical-slices.md#folders-that-are-not-slices): it holds what all database Humble Objects share, plus the Module that registers it.

Here's what each building block contributes:

- **The domain model.** `ToDoItem` checks its preconditions when it is created - a title must not be empty - so nobody can create one in an invalid state. It knows nothing about how it's stored.
- **The Request DTO and its validator.** `NewToDoItemDto` carries the title sent by the client and stays untrusted until `NewToDoItemDtoValidator` has checked it.
- **The Session.** Because the feature writes data and the endpoint controls when to commit, its Humble Object is a Session. `AddToDoItemSession` is the Core-owned abstraction with methods to add an item and commit; `SqlAddToDoItemSession` implements it for the database.
- **The endpoint.** `AddToDoItemEndpoint` receives the DTO, calls the validator, creates the `ToDoItem`, passes it to the Session, and commits.
- **The Module.** `AddToDoItemModule` registers the endpoint, validator, and Session, and maps the route to the endpoint.

A few things in here are worth a closer look:

- **The endpoint calls the validator directly.** Both are Core types, so there's no abstraction between them and one Unit Test covers both.
- **The current time comes from an abstraction.** The item records when it was created. Instead of reading the system clock directly, the endpoint uses a clock abstraction so tests can decide what time it is.
- **There is no service.** The logic is small enough to stay in the endpoint. Once it grows more complex (coordinating multiple entities, interdependent rules, or several Humble Objects), extract a service that the endpoint calls directly. Your Unit Tests stay the same because they target the endpoint.
- **The Module doesn't register everything the slice uses.** The Session depends on the database connection and the endpoint depends on the clock abstraction, both owned by other parts of the application. If this Module registered them as well, they'd be registered twice, and startup would depend on Module execution order (see [Modules](./composition-root.mdx#modules)).

## Testing the slice

The Unit Tests target the endpoint while using the real validator and real domain model. Only the Session is replaced. Because the tests check what the endpoint passed to the Session, the Test Double is a [Spy](./automated-tests.mdx#test-doubles) named accordingly: `AddToDoItemSessionSpy` records added items and counts commits.

One test sends a valid DTO and asserts that exactly one item was added with a trimmed title and the test's timestamp, and that the Session committed once. Another sends an empty title and asserts that the endpoint returns a validation error without touching the Session. Because these tests run entirely in memory, you can add edge and error cases freely (such as an overly long title or a Session Stub that simulates a concurrency conflict) while keeping the suite fast.

Unit Tests can't tell you whether the Session, database mapping, Module registrations, and route mapping work together. Cover that wiring with one happy-path Integration Test: start the application with the real Composition Root and a real database, send a request, and verify that the item ends up in the database. See [Automated Tests](./automated-tests.mdx) for the reasoning.

:::tip[In .NET Practice]
[A Complete Slice in ASP.NET Core](./dotnet/a-complete-slice.md) shows this feature in code, from the entity to the Unit Tests.
:::
