---
sidebar_position: 6
title: Vertical Slices
---

# Vertical Slices

:::note[Not part of CHACK]
CHACK says which *category* a piece of code belongs to. It says nothing about which *folder* it goes in. Vertical slices are a way to organize folders and files, and you can practice CHACK perfectly well without them.

That said, the two fit together so naturally that I use them in every project. This page explains why - and it is written entirely in .NET terms, because it is a worked example rather than a definition.
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

Vertical slices organize folders by feature or use case instead, driven by the requirements:

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

Everything a feature needs lives together: DTOs, services, validators, endpoints, I/O abstractions, humble objects, and the DI registrations. In CHACK terms, one folder usually contains code from three of the four categories - Core, Humble Objects, and a piece of the Composition Root.

The problems above go away:

- You can see at a glance that this application deals with orders and invoices, not with cooking recipes. The domain language is in the folder names.
- Files that change together sit next to each other.
- You can judge the size of a feature by expanding its folder.
- Two developers working on two features rarely produce merge conflicts, because they work in different directories.

There is one cost: as the application grows, you will spend a little more time refactoring the folder structure than you would with fixed technical folders. In my experience that time is well spent - the structure keeps telling the truth about the system.

Not every top-level folder is a slice, and that is fine. Some frameworks require a shape of their own - Entity Framework Core wants a `DbContext` with `DbSet` properties for all entities, so a `DatabaseAccess` folder earns its place. The Composition Root usually gets its own folder as well.

Vertical slices were described by Jimmy Bogard in [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/).

## Slices nest

A slice can contain sub-slices, in the same way a feature can be broken down into smaller use cases:

```text
📁 WebApp
|- 📁 ...
|- 📁 Notifications
|- 📁 Orders
|  |- 📁 CancelOrder
|  |- 📁 OrderHistory
|  |- 📁 Queuing
|     |- 📁 CreateQueueItem
|     |- 📁 DeleteQueueItem
|     |- 📁 MoveQueueItem
|     |- 📁 RemoveAllPendingItemsFromQueue
|- 📁 Shipping
|- 📁 ...
```

Here, "Orders" has a sub-feature "Queuing", which in turn has four endpoints. This works well with a [one endpoint per file](https://ardalis.com/moving-from-controllers-and-actions-to-endpoints-with-mediatr/) approach, and it lines up with the testing advice from [Automated Tests](./automated-tests.mdx): the endpoint is the most abstract API of the leaf slice, and that is where the unit tests aim.

## Each folder is a Composition Root module

Since each folder contains a feature (leaf folders) or a set of features (parent folders), it can also contain the code that registers that feature with the DI container. Give each folder a `*Module` class:

```csharp
public static class CreateQueueItemModule
{
    public static IServiceCollection AddCreateQueueItemModule(this IServiceCollection services) =>
        services
           .AddSingleton<NewQueueItemDtoValidator>()
           .AddScoped<ICreateQueueItemSession, EfCreateQueueItemSession>();
}
```

A parent folder that contains sub-features only calls into its children:

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

The actual Composition Root then only calls into the top-level modules, and adding a feature never means editing a central registration file. Note that the registration code physically lives in the feature folder but belongs to the Composition Root category - the diagram's boxes are about roles, not directories.

## Sharing code between slices

Consider two sub-features that turn out to need exactly the same session interface and implementation:

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

Unify them and move the result up into the parent folder:

```text
📁 WebApp
|- 📁 FeatureA
   |- 📁 SubFeatureA1
   |  |- 📄 SubFeatureA1Dto.cs
   |  |- 📄 SubFeatureA1DtoValidator.cs
   |  |- 📄 SubFeatureA1Endpoint.cs
   |- 📁 SubFeatureA2
   |  |- 📄 SubFeatureA2Dto.cs
   |  |- 📄 SubFeatureA2DtoValidator.cs
   |  |- 📄 SubFeatureA2Endpoint.cs
   |- 📄 EfFeatureASession.cs
   |- 📄 FeatureAModule.cs
   |- 📄 IFeatureASession.cs
```

Both sub-features now reference `IFeatureASession`, and `FeatureAModule` registers it. If the parent folder gets crowded, a `Shared` folder inside `FeatureA` works just as well.

Two rules keep this from degenerating:

- **Vertical slices are a folder convention, not a code-sharing mechanism.** How you share code is a separate decision.
- **Keep the dependency graph clean.** Two sibling features must never reference each other. A unidirectional reference is acceptable. As soon as a cycle appears between folders, move the shared code up into a common parent or into a new folder - the cycle is telling you the code does not belong to either feature.
