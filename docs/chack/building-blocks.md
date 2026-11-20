---
sidebar_position: 7
title: Building Blocks of a Backend Feature
description: "The building blocks you meet in every backend feature, such as endpoints, DTOs, and validators, and the CHACK category each one belongs to."
image: /img/social-cards/docs-chack-building-blocks.jpg
---

# Building Blocks of a Backend Feature

## The building blocks

The four categories tell you where a piece of code belongs. When you build a backend feature - an HTTP endpoint, or a handler for a message from a broker - you'll meet the same handful of building blocks again and again:

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

You might wonder where the route of an endpoint is defined. Mapping a route or a message subscription to an endpoint is part of the [Composition Root](./composition-root.mdx), and in practice, it often lives in the slice's Module.

### Validators as an anti-corruption layer

A validator can do more than answer "valid or not". When it turns a valid DTO directly into domain objects, it works as an anti-corruption layer, a term from Domain-Driven Design: the shape of the outside world - field names, optional values, formats - stops at the validator, and everything behind it works with domain objects that can't be in an invalid state. The endpoint never has to handle an unchecked value, and the domain model doesn't need to know what the request looked like.

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

`ToDoItem` sits in the parent folder because other slices below `ToDoItems` use it, too. `DatabaseAccess` is a [folder that is not a slice](./vertical-slices.md#folders-that-are-not-slices): it holds what all database Humble Objects share, and the Module that registers it.

Here's what each building block contributes:

- **The domain model.** `ToDoItem` checks its preconditions when it is created - a title must not be empty - so nobody can create one in an invalid state. It knows nothing about how it's stored.
- **The Request DTO and its validator.** `NewToDoItemDto` carries the title that the client sent. It's untrusted until `NewToDoItemDtoValidator` has checked it.
- **The Session.** The feature changes data, and the endpoint decides when to commit, so its Humble Object is a Session. `AddToDoItemSession` is the abstraction that the Core owns: it can add an item and commit. `SqlAddToDoItemSession` implements it for the database.
- **The endpoint.** `AddToDoItemEndpoint` receives the DTO, calls the validator, creates the `ToDoItem`, hands it to the Session, and commits.
- **The Module.** `AddToDoItemModule` registers the endpoint, the validator, and the Session, and maps the route to the endpoint.

A few things in here are worth a closer look:

- **The endpoint calls the validator directly.** Both are Core types, so there's no abstraction between them, and one Unit Test covers both.
- **The current time comes from an abstraction.** The item records when it was created. The endpoint doesn't read the system clock itself, so tests can decide what time it is.
- **There is no service.** The logic is small enough to live in the endpoint. When it grows - several entities, rules that depend on each other, calls to more than one Humble Object - you can move it into a service that the endpoint calls directly. The tests stay the same, because they aim at the endpoint.
- **The Module doesn't register everything the slice needs.** The Session depends on the database connection, and the endpoint depends on the clock abstraction, but other parts of the application own them. If this Module registered them as well, they'd be registered twice, and the outcome would depend on the order in which the Modules run. [Modules](./composition-root.mdx#modules) explains this in more detail.

## Testing the slice

The Unit Tests aim at the endpoint and let the real validator and the real domain model take part. Only the Session is replaced. Since the tests want to observe what the endpoint did with it, the Test Double is a [Spy](./automated-tests.mdx#test-doubles), and its name says so: `AddToDoItemSessionSpy` records the added items and counts the commits.

One test sends a valid DTO and checks that exactly one item was added, with a trimmed title and the time the test chose, and that the Session was committed once. Another sends an empty title and checks that the endpoint reports a validation error and never touches the Session. These tests never leave memory, so you can add many more for edge and error cases - a title that is too long, or a Session Stub that reports a concurrency conflict - and your test suite stays fast.

What the Unit Tests can't tell you is whether the Session, the database mapping, the Module, and the route mapping work together. That's the job of one Integration Test for the happy path: it starts the application with the real Composition Root and a real database, sends a request, and checks that the item ends up in the database. See [Automated Tests](./automated-tests.mdx) for the reasoning.

:::tip[In .NET Practice]
[A Complete Slice in ASP.NET Core](./dotnet/a-complete-slice.md) shows this feature in code, from the entity to the Unit Tests.
:::
