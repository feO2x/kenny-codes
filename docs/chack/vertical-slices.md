---
sidebar_position: 8
title: Vertical Slices
---

# Organizing Code with Vertical Slices

:::info[Not a fifth category]
The four categories tell you what a piece of code *is*. Vertical slices help you decide which *folder* it goes in. That's why a slice folder usually contains code from three categories: Core, Humble Objects, and the slice's part of the Composition Root.
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

There is one cost: as the application grows, you will spend a little more time refactoring the folder structure than you would with fixed technical folders. In my experience, that time is well spent, and [Keeping slices clean](#keeping-slices-clean) shows how to make it a habit.

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

Each folder can also bring its own registrations, in the form of a [Module](./composition-root.mdx#modules). A parent Module calls the Modules of its children, and the Composition Root only calls the top-level Modules. When you add a feature, you add its Module next to it and call it from the parent - there's no central registration file that everybody edits.

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

Sooner or later, two slices need the same code. Imagine two sub-features that turn out to need exactly the same Session:

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

You can unify them and move the result up into the closest common parent:

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

Both sub-features now reference `IFeatureASession`. Because the Session lives in `FeatureA`, `FeatureAModule` registers it, and the Modules of the two sub-features don't need to know about it.

A few ideas guide moves like this one:

- **Shared code moves up.** When two or more slices use the same code, its natural home is their closest common parent, or a sibling folder named after the concept it represents.
- **Code that is no longer shared moves back down.** If one of the two slices stops using the Session, it belongs to the remaining slice again.
- **Sharing a Humble Object requires identical needs.** Two slices share a Client or Session only if they need exactly the same abstraction. Often, they only share implementation code. Then each slice keeps its own Humble Object, and the common code moves up as a static method, as shown in [Clients and Sessions](./clients-and-sessions.md#sharing-code-without-sharing-abstractions).
- **Dependencies between slices point in one direction.** A slice may use code of another slice, as long as the other slice doesn't use code of the first one in return. When such a cycle appears, it's a sign that the code in between belongs to neither feature. A common parent or a new sibling folder gives it a home of its own.

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

These folders are perfectly fine, and they work a little differently:

- They can be organized by technology. `DatabaseAccess` and `Messaging` describe exactly what you'll find inside.
- They can contain Modules, options, base types for Humble Objects, and shared static methods that Humble Objects call.
- They stay free of feature-specific logic. When a type in `DatabaseAccess` starts to know what an order is, it has found its way into the wrong folder - the `Orders` slice or one of its concept folders is a better home.

## Keeping slices clean

The structure of a codebase is most helpful when it tells the truth about the system. The easiest way to keep it that way is to tidy up folders as part of feature work, while the context is still fresh - rather than planning a separate task for it.

- **A parent folder holds its Module and the code its children share.** When shared types pile up in a parent folder, grouping them into sibling folders named after the concept they represent makes them easier to find - for example, the domain model of an aggregate together with its persistence mapping, or the access to a particular third-party system.
- **Code that only one slice uses lives in that slice.**
- **Code lives in the folder of the slice or concept it belongs to, and that folder's Module registers it.**
- **Each change to a slice is a good moment to look around.** Did the change make code shared that wasn't before? Did it leave code behind that only one slice still uses?

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

The test projects follow the same structure as the production code. The Unit Tests for `Orders/Queuing/CreateQueueItem` live in `Orders/Queuing/CreateQueueItem` of the test project, next to the Test Doubles they need. When a slice moves, its tests move with it, and whenever you look for the tests of a feature, you know right away where to find them.

```text
📁 WebApp.Tests
|- 📁 Orders
   |- 📁 Queuing
      |- 📁 CreateQueueItem
         |- 📄 CreateQueueItemEndpointTests.cs
         |- 📄 CreateQueueItemSessionSpy.cs
```
