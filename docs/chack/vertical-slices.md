---
sidebar_position: 8
title: Vertical Slices
---

# Organizing Code with Vertical Slices

:::info[Not a fifth category]
The four categories tell you what a piece of code *is*. Vertical slices tell you which *folder* it goes in. A slice folder usually contains code from three categories: Core, Humble Objects, and the slice's part of the Composition Root.
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
- Working on a single feature means editing files in three to seven directories. Under time pressure, that is how you accidentally touch something that belongs to another feature and introduce a subtle regression.
- Where does a long-lived coordinating service go? Is `OrderQueueManager` a "service"? So is everything else.

Vertical slices organize folders by feature instead, driven by the requirements:

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

The problems above go away:

- You can see at a glance that this application deals with orders and invoices, not with cooking recipes. The domain language is in the folder names.
- Files that change together sit next to each other.
- You can judge the size of a feature by expanding its folder.
- Two developers working on two features rarely produce merge conflicts, because they work in different directories.

There is one cost: as the application grows, you will spend a little more time refactoring the folder structure than you would with fixed technical folders. In my experience that time is well spent - see [Keeping slices clean](#keeping-slices-clean).

Vertical slices were described by Jimmy Bogard in [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/).

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
|  |  |- 📄 QueuingModule.cs
|  |- 📄 OrdersModule.cs
|- 📁 Shipping
|- 📁 ...
```

Here, "Orders" has a sub-feature "Queuing", which in turn has four endpoints. This works well with a [one endpoint per file](https://ardalis.com/moving-from-controllers-and-actions-to-endpoints-with-mediatr/) approach, and it lines up with the advice from [Automated Tests](./automated-tests.mdx): the endpoint is the most abstract API of a leaf slice, and that is where the Unit Tests aim.

Every folder contributes its registrations through a [Module](./composition-root.mdx#modules). A parent Module calls the Modules of its children, and the Composition Root only calls the top-level Modules. Adding a feature therefore never means editing a central registration file.

:::tip[In .NET Practice]
A Module is a static class with an extension method on `IServiceCollection`. A leaf Module registers the types of its own folder:

```csharp
public static class CreateQueueItemModule
{
    public static IServiceCollection AddCreateQueueItemModule(this IServiceCollection services) =>
        services
           .AddSingleton<NewQueueItemDtoValidator>()
           .AddScoped<ICreateQueueItemSession, EfCreateQueueItemSession>()
           .AddScoped<CreateQueueItemEndpoint>();
}
```

A parent Module calls into its children:

```csharp
public static class QueuingModule
{
    public static IServiceCollection AddQueuingModule(this IServiceCollection services) =>
        services
           .AddCreateQueueItemModule()
           .AddDeleteQueueItemModule()
           .AddMoveQueueItemModule()
           .AddRemoveAllPendingItemsFromQueueModule();
}
```
:::

## Hierarchy and sharing

Sooner or later, two slices need the same code. Consider two sub-features that turn out to need exactly the same Session:

```text
📁 WebApp
|- 📁 FeatureA
   |- 📁 SubFeatureA1
   |  |- 📄 EfSubFeatureA1Session.cs
   |  |- 📄 ISubFeatureA1Session.cs
   |  |- 📄 SubFeatureA1Dto.cs
   |  |- 📄 SubFeatureA1DtoValidator.cs
   |  |- 📄 SubFeatureA1Endpoint.cs
   |  |- 📄 SubFeatureA1Module.cs
   |- 📁 SubFeatureA2
   |  |- 📄 EfSubFeatureA2Session.cs
   |  |- 📄 ISubFeatureA2Session.cs
   |  |- 📄 SubFeatureA2Dto.cs
   |  |- 📄 SubFeatureA2DtoValidator.cs
   |  |- 📄 SubFeatureA2Endpoint.cs
   |  |- 📄 SubFeatureA2Module.cs
   |- 📄 FeatureAModule.cs
```

Unify them and move the result up into the closest common parent:

```text
📁 WebApp
|- 📁 FeatureA
   |- 📁 SubFeatureA1
   |  |- 📄 SubFeatureA1Dto.cs
   |  |- 📄 SubFeatureA1DtoValidator.cs
   |  |- 📄 SubFeatureA1Endpoint.cs
   |  |- 📄 SubFeatureA1Module.cs
   |- 📁 SubFeatureA2
   |  |- 📄 SubFeatureA2Dto.cs
   |  |- 📄 SubFeatureA2DtoValidator.cs
   |  |- 📄 SubFeatureA2Endpoint.cs
   |  |- 📄 SubFeatureA2Module.cs
   |- 📄 EfFeatureASession.cs
   |- 📄 FeatureAModule.cs
   |- 📄 IFeatureASession.cs
```

Both sub-features now reference `IFeatureASession`, and because the Session lives in `FeatureA`, `FeatureAModule` registers it - not the Modules of the two sub-features.

The rules behind this move:

- **Shared code moves up.** When code is used by two or more slices, move it to their closest common parent, or into a sibling folder named after the concept it represents.
- **Code that is no longer shared moves back down.** When one of the two slices stops using the Session, it belongs to the remaining slice again.
- **Shared Humble Objects need identical needs.** Two slices only share a Client or Session if they require exactly the same abstraction. Often, they only share implementation code - then each slice keeps its own Humble Object, and the common code moves up as a static method. See [Clients and Sessions](./clients-and-sessions.md#sharing-code-without-sharing-abstractions).
- **Dependencies between slices point in one direction.** A slice may use code of another slice, but never the other way around at the same time. As soon as a cycle appears, move the shared code into a common parent or into a new sibling folder - the cycle is telling you that the code does not belong to either feature.

## Folders that are not slices

Not every folder represents a feature. Some folders extend frameworks and libraries and adapt them to the application: messaging infrastructure, persistence infrastructure, object storage access, authentication - or the Composition Root itself.

```text
📁 WebApp
|- 📁 CompositionRoot
|- 📁 DatabaseAccess
|  |- 📄 AppDbContext.cs
|  |- 📄 DatabaseAccessModule.cs
|  |- 📄 DatabaseOptions.cs
|  |- 📄 EfSession.cs
|  |- 📄 IAsyncSession.cs
|- 📁 Messaging
|- 📁 Orders
|- 📁 ...
```

These folders are fine, and they follow slightly different rules:

- They may be organized by technology. `DatabaseAccess` and `Messaging` are honest names here.
- They may contain Modules, options, base types for Humble Objects, and shared static methods that Humble Objects call.
- They do not contain feature-specific logic. As soon as a type in `DatabaseAccess` knows what an order is, it belongs into the `Orders` slice or one of its concept folders.

## Keeping slices clean

The structure of a codebase should tell the truth about the system. That only works if restructuring folders is part of feature work, not a separate task that never gets prioritized.

- **A parent folder only contains its Module and code that is shared by its children.** When shared types accumulate in a parent folder, group them into sibling folders named after the concept they represent - for example, the domain model of an aggregate together with its persistence mapping, or the access to a particular third-party system.
- **Code that is only used by a single slice moves down into that slice.**
- **Code lives in the folder of the slice or concept it belongs to, and is registered by that folder's Module.**
- **Re-evaluate shared code whenever a slice is added, changed, or removed.** Did the change make code shared that was not before? Did it leave code behind that only one slice still uses?

Here is what a grown `Orders` slice can look like after a few rounds of this:

```text
📁 Orders
|- 📁 CancelOrder
|- 📁 OrderAggregate
|  |- 📄 Order.cs
|  |- 📄 OrderConfiguration.cs
|  |- 📄 OrderLine.cs
|  |- 📄 OrderQueries.cs
|  |- 📄 OrderStatus.cs
|- 📁 OrderHistory
|- 📁 PaymentProvider
|  |- 📄 PaymentProviderModule.cs
|  |- 📄 PaymentProviderOptions.cs
|  |- 📄 PaymentProviderRequests.cs
|- 📁 Queuing
|- 📄 OrdersModule.cs
```

`OrderAggregate` groups the domain model with its O/R mapping configuration and the static query methods that several Sessions call. `PaymentProvider` holds what several slices need to talk to the payment provider's API. The parent folder `Orders` itself only holds its Module.

## Tests mirror the slices

The test projects follow the same structure as the production code. The Unit Tests for `Orders/Queuing/CreateQueueItem` live in `Orders/Queuing/CreateQueueItem` of the test project, next to the Test Doubles they need. When a slice moves, its tests move with it, and when you look for the tests of a feature, there is exactly one place to look.

```text
📁 WebApp.Tests
|- 📁 Orders
   |- 📁 Queuing
      |- 📁 CreateQueueItem
         |- 📄 CreateQueueItemEndpointTests.cs
         |- 📄 CreateQueueItemSessionSpy.cs
```
