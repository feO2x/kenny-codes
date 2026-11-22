---
sidebar_position: 8
title: Vertical Slices
image: /img/social-cards/docs-chack-vertical-slices.jpg
---

# Organizing Code with Vertical Slices

:::info[Recommended, not required]
CHACK works with any folder structure, but it prefers vertical slices. The four categories define what role a piece of code plays; vertical slices organize where its files live. Because of that, a single slice folder typically holds Core types, Humble Objects, and the slice's Composition Root Module side by side.
:::

## Organize by feature, not by technical concern

Most examples you find organize folders around technical concerns:

```text
📁 WebApp
|- 📁 Controllers
|- 📁 DatabaseAccess
|- 📁 DataTransferObjects
|- 📁 Enums
|- 📁 Interfaces
|- 📁 Middleware
|- 📁 Services
|- 📁 Validators
```

This is easy to understand on day one and starts to hurt around month six:

- The folder names express no intent. Looking at the top level tells a newcomer nothing about what the application does.
- You cannot see how much code belongs to a feature, because it is scattered across folders.
- Working on a single feature means editing files in three to seven directories. Under time pressure, that is how you accidentally touch something that belongs to another feature and introduce a subtle regression if your test suite cannot catch it.
- Where does a long-lived coordinating service go? Is `OrderQueueManager` a "service"? So is everything else.

Vertical slices organize folders by feature instead, driven by the requirements. (The folder trees on these pages leave out file extensions, since they depend on your language.)

```text
📁 WebApp
|- 📁 CompositionRoot
|- 📁 Customers
|- 📁 DatabaseAccess
|- 📁 Invoicing
|- 📁 Notifications
|- 📁 Orders
|- 📁 Shipping
```

A slice contains everything that belongs to its feature. In a backend system, that is typically one endpoint with its DTOs, validators, services, I/O abstractions, Humble Objects, and Module - the [building blocks of a backend feature](./building-blocks.md).

Organizing by feature avoids those problems:

- You can see immediately that this application deals with orders and invoices, not cooking recipes. The domain language shows up directly in the folder names.
- Files that change together sit next to each other.
- You can judge the size of a feature simply by expanding its folder.
- Two developers working on different features rarely produce merge conflicts because they edit files in separate directories.

There is one cost: as the application grows, you will spend a little more time refactoring the folder structure than you would with fixed technical folders. In my experience, that time is well spent, and [Keeping slices clean](#keeping-slices-clean) shows how to make it a habit.

CHACK's Vertical Slices borrow their name and core idea from Jimmy Bogard's [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/), but in CHACK they only govern folder organization. [Relationship to Other Approaches](./relationship-to-other-approaches.md#vertical-slice-architecture) compares the two.

## Slices nest

A slice can contain sub-slices, in the same way a feature can be broken down into smaller use cases:

```text
📁 WebApp
|- 📁 ...
|- 📁 Orders
|  |- 📁 CancelOrder
|  |- 📁 OrderHistory
|  |- 📁 Queuing
|  |  |- 📁 CreateQueueItem
|  |  |- 📁 DeleteQueueItem
|  |  |- 📁 MoveQueueItem
|  |  |- 📁 RemoveAllPendingItemsFromQueue
|  |  |- 📄 QueuingModule
|  |- 📄 OrdersModule
|- 📁 Shipping
|- 📁 ...
```

Here, "Orders" has a sub-feature "Queuing", which in turn has four endpoints. This works well with a [one endpoint per file](https://ardalis.com/moving-from-controllers-and-actions-to-endpoints-with-mediatr/) approach, and it lines up with the advice from [Automated Tests](./automated-tests.mdx): the endpoint is the most abstract API of a leaf slice, and that is where the Unit Tests aim.

Each folder can also own its DI registrations through a [Module](./composition-root.mdx#modules). `CreateQueueItemModule` registers the endpoint, validator, and Session of its slice. `QueuingModule` calls the Modules of its four children, `OrdersModule` calls `QueuingModule` and its other children, and the Composition Root only calls the top-level Modules. When you add a feature, you add its Module next to it and call it from the parent - there's no central registration file that everyone edits.

## Hierarchy and sharing

Sooner or later, two slices need the same code. Imagine two sub-features that turn out to need exactly the same Session:

```text
📁 WebApp
|- 📁 FeatureA
   |- 📁 SubFeatureA1
   |  |- 📄 SqlSubFeatureA1Session
   |  |- 📄 SubFeatureA1Dto
   |  |- 📄 SubFeatureA1DtoValidator
   |  |- 📄 SubFeatureA1Endpoint
   |  |- 📄 SubFeatureA1Module
   |  |- 📄 SubFeatureA1Session
   |- 📁 SubFeatureA2
   |  |- 📄 SqlSubFeatureA2Session
   |  |- 📄 SubFeatureA2Dto
   |  |- 📄 SubFeatureA2DtoValidator
   |  |- 📄 SubFeatureA2Endpoint
   |  |- 📄 SubFeatureA2Module
   |  |- 📄 SubFeatureA2Session
   |- 📄 FeatureAModule
```

You can unify them and move the result up into the closest common parent:

```text
📁 WebApp
|- 📁 FeatureA
   |- 📁 SubFeatureA1
   |  |- 📄 SubFeatureA1Dto
   |  |- 📄 SubFeatureA1DtoValidator
   |  |- 📄 SubFeatureA1Endpoint
   |  |- 📄 SubFeatureA1Module
   |- 📁 SubFeatureA2
   |  |- 📄 SubFeatureA2Dto
   |  |- 📄 SubFeatureA2DtoValidator
   |  |- 📄 SubFeatureA2Endpoint
   |  |- 📄 SubFeatureA2Module
   |- 📄 FeatureAModule
   |- 📄 FeatureASession
   |- 📄 SqlFeatureASession
```

Both sub-features now reference `FeatureASession`. Because the Session lives in `FeatureA`, `FeatureAModule` registers it, and the Modules of the two sub-features don't need to know about it.

When you move code up or down the folder tree, keep these rules in mind:

- **Shared code moves up.** When two or more slices use the same code, move it into their closest common parent or into a sibling folder named after the concept it represents.
- **Code that is no longer shared moves back down.** If one of the two slices stops using the Session, move it back into the remaining slice.
- **Sharing a Humble Object requires identical needs.** Two slices share a Client or Session only when they require the exact same abstraction. Often they only share implementation code; in that case, keep separate Humble Objects and move the shared query or mapping up as a static method (see [Clients and Sessions](./clients-and-sessions.md#sharing-code-without-sharing-abstractions)).
- **Dependencies between slices point in one direction.** One slice may use types from another slice, provided the second slice doesn't reference the first in return. A cyclic dependency means the shared logic belongs to neither feature - extract it into a common parent or a new sibling folder.

## Folders that are not slices

Not every folder represents a feature. Some folders adapt frameworks and infrastructure libraries to your application: messaging infrastructure, persistence infrastructure, object storage access, authentication, or the Composition Root itself.

```text
📁 WebApp
|- 📁 CompositionRoot
|- 📁 DatabaseAccess
|  |- 📄 AppDatabaseContext
|  |- 📄 DatabaseAccessModule
|  |- 📄 DatabaseOptions
|  |- 📄 Session
|  |- 📄 SqlSessionBase
|- 📁 Messaging
|- 📁 Orders
|- 📁 ...
```

Technical infrastructure folders are fine in CHACK, with a few boundaries:

- Organize them by technology. `DatabaseAccess` and `Messaging` tell you right away what's inside.
- Put Modules, options, base types for Humble Objects, and shared static methods that Humble Objects call here.
- Keep feature-specific domain logic out. If a type in `DatabaseAccess` starts referencing domain concepts like `Order`, move it into the `Orders` slice or one of its concept folders.

## Keeping slices clean

The structure of a codebase is most helpful when it tells the truth about the system. Tidy up folders as part of normal feature work while the context is fresh, instead of scheduling a separate refactoring task.

- **Limit loose shared files in parent folders.** Up to five shared files next to a parent Module are easy to scan. At six or seven, look for a domain concept that groups some of them. Beyond seven, regroup all of them - not just the newest ones - into sibling folders named after their concepts (for example, an aggregate's domain model and persistence mapping, or everything needed to talk to a specific third-party API). Ideally, the parent folder then holds only its Module, like `Orders` below. Name concept folders after what they represent, such as `OrderAggregate` or `PaymentProvider`, never `Shared` or `Common`: a folder of leftovers is a technical folder again. If no concept emerges, some of those files may belong under a different parent. Treat the numbers as a rule of thumb rather than a hard limit: the goal is that a newcomer can understand the folder quickly.
- **Code used by only one slice stays in that slice.**
- **Every type lives in the folder of the slice or concept it belongs to, and that folder's Module registers it.**
- **Treat every change to a slice as a quick folder check.** Did the change make previously private code shared, or leave shared code behind that only one slice still uses?

After a few iterations of tidying up, a larger `Orders` slice might look like this:

```text
📁 Orders
|- 📁 CancelOrder
|- 📁 OrderAggregate
|  |- 📄 Order
|  |- 📄 OrderLine
|  |- 📄 OrderMapping
|  |- 📄 OrderQueries
|  |- 📄 OrderStatus
|- 📁 OrderHistory
|- 📁 PaymentProvider
|  |- 📄 PaymentProviderModule
|  |- 📄 PaymentProviderOptions
|  |- 📄 PaymentProviderRequests
|- 📁 Queuing
|- 📄 OrdersModule
```

`OrderAggregate` groups the domain model with its O/R mapping configuration and the static query methods shared by several Sessions. `PaymentProvider` holds what several slices need to call the payment provider's API. The parent folder `Orders` itself only contains its Module.

You can also keep the entire domain model in a single top-level folder like `DomainModel` next to the feature slices. That works well when most entities are used across many features: every entity is easy to locate, and each slice holds only its feature-specific code. The trade-off is that domain types no longer sit right next to the features that use them. Both ways work - pick one and stick with it so everyone on the team knows where to look.

## Tests mirror the slices

The test projects follow the same structure as the production code. The Unit Tests for `Orders/Queuing/CreateQueueItem` live in `Orders/Queuing/CreateQueueItem` of the test project, next to the Test Doubles they need. When a slice moves, its tests move with it, and whenever you look for the tests of a feature, you know right away where to find them.

```text
📁 WebApp.Tests
|- 📁 Orders
   |- 📁 Queuing
      |- 📁 CreateQueueItem
         |- 📄 CreateQueueItemEndpointTests
         |- 📄 CreateQueueItemSessionSpy
```

:::tip[In .NET Practice]
[The Composition Root in .NET](./dotnet/composition-root.md#modules) shows how Modules for nested slices look as extension methods, and [A Complete Slice in ASP.NET Core](./dotnet/a-complete-slice.md) shows a slice folder with all its files.
:::
