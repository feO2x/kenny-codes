---
sidebar_position: 6
title: Clients and Sessions
---

# Clients and Sessions

:::note[A worked example]
This page goes deeper into the Humble Objects that the Core calls, and the examples are .NET throughout: Entity Framework Core for database access and a typed `HttpClient` for a web service. The language-neutral rules are on the [Humble Objects](./humble-objects.mdx) page.
:::

## Who controls the transaction?

Every Humble Object that the Core uses acts in one of two ways. Which one depends on a single question: **does the Core control the transaction?**

- A **Client** is used when the Core does not control transactions. The Core calls a method, the I/O happens, and the result comes back. A Client may use a transaction internally - for example, a query that runs with the Read Uncommitted isolation level - but that transaction starts and ends inside the method, and the Core never sees it.
- A **Session** is used when the Core controls a transaction. The Core loads data, changes it in memory, and decides when the changes are committed. A Session therefore offers a method to commit, usually called `SaveChangesAsync`. Disposing a Session without committing rolls back all changes.

|                           | Client                                     | Session                                       |
|---------------------------|--------------------------------------------|-----------------------------------------------|
| Who controls transactions | Nobody, or the Client internally           | The Core                                      |
| Commit method             | None                                       | `SaveChangesAsync` or similar                 |
| Typical use               | Queries, web service calls, sending messages | Use cases that change data in a database     |
| When disposed             | Releases its resources                     | Rolls back everything that was not committed |

It follows that a Humble Object which only reads data and offers no way to commit is a Client, not a Session - even if it talks to the same database as the Sessions next to it.

## A Session is a Unit of Work

According to [Patterns of Enterprise Application Architecture](https://martinfowler.com/books/eaa.html), a [Unit of Work](https://martinfowler.com/eaaCatalog/unitOfWork.html) handles three things:

- Keeping track of the objects affected during a business transaction (change tracking)
- Coordinating the writing out of those changes (DML generation)
- Resolving concurrency problems (database transactions or optimistic concurrency)

Entity Framework Core's `DbContext` already implements all three. A Session on top of it is therefore a thin layer between the Core and EF Core: it exposes exactly the operations one feature needs, in the Core's vocabulary, and nothing else. Because a Session represents a transaction, it also marks the transaction boundary of exactly one feature.

## Implementing a Session

The Core programs against an interface that describes what one feature needs. Every Session can commit, so pull that into a base interface:

```csharp
public interface IAsyncSession
{
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
```

The name avoids a collision with `Microsoft.AspNetCore.Http.ISession`. The abstraction of a feature then only carries what is specific to it:

```csharp
public interface IAddToDoItemSession : IAsyncSession
{
    void AddToDoItem(ToDoItem item);
}
```

Committing is the same in every Session, and so is translating EF Core's concurrency exception into one the Core understands. Both belong in a base class:

```csharp
public abstract class EfSession<TDbContext>(TDbContext dbContext) : IAsyncSession
    where TDbContext : DbContext
{
    protected TDbContext DbContext { get; } = dbContext;

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await DbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException exception)
        {
            throw new ConcurrencyConflictException(
                "The data was changed by someone else in the meantime.",
                exception
            );
        }
    }
}
```

`ConcurrencyConflictException` is a Core type. The Core can catch it and decide what to do - retry, report a conflict to the caller, or give up - without knowing that EF Core exists.

The implementation of a feature's Session is reduced to the one thing that is actually specific to it. The `Ef` prefix says which technology is behind the abstraction:

```csharp
public sealed class EfAddToDoItemSession(AppDbContext dbContext)
    : EfSession<AppDbContext>(dbContext), IAddToDoItemSession
{
    public void AddToDoItem(ToDoItem item) => DbContext.ToDoItems.Add(item);
}
```

Where is the rollback? EF Core collects changes in memory and only writes them inside `SaveChangesAsync`, wrapped in a database transaction. A Session that is disposed without committing leaves the database untouched. When a feature needs an explicit transaction - for example, with the Serializable isolation level - the Session begins it with `DbContext.Database.BeginTransactionAsync`, commits it in `SaveChangesAsync`, and disposes it in its own `DisposeAsync`. Disposing an uncommitted transaction rolls it back.

Notice that the Session does not dispose the `DbContext`. With `AddDbContext`, the DI container creates a `DbContext` per scope and disposes it at the end of the scope, so the container owns it. The rule is: whoever creates a resource disposes it. If a Session creates its `DbContext` itself, for example through `IDbContextFactory<TDbContext>`, it owns it and must implement `IAsyncDisposable`.

## Implementing a Client

A Client that reads from the database looks almost the same, minus the commit:

```csharp
public interface IOrderQueueClient
{
    Task<List<OrderQueueEntry>> GetOrderQueueAsync(CancellationToken cancellationToken = default);
}

public sealed class EfOrderQueueClient(AppDbContext dbContext) : IOrderQueueClient
{
    public Task<List<OrderQueueEntry>> GetOrderQueueAsync(CancellationToken cancellationToken = default) =>
        dbContext
           .Orders
           .AsNoTracking()
           .OrderBy(order => order.QueueItem.Position)
           .Select(order => new OrderQueueEntry
            {
                OrderId = order.Id,
                Status = order.QueueItem.Status,
                LastChangedUtc = order.QueueItem.StatusChangedUtc
            })
           .ToListAsync(cancellationToken);
}
```

Notice what this method is: one I/O call plus a mapping - exactly the two jobs a Humble Object has. The mapping is a projection that EF Core translates to SQL, so there is nothing to unit-test here. It is covered by the Integration and End-to-End tests of the feature.

Clients are not tied to databases. A typed `HttpClient` that calls a web service is a Client as well:

```csharp
public interface IShippingRatesClient
{
    Task<ShippingRate?> GetShippingRateAsync(
        string countryCode,
        decimal weightInKg,
        CancellationToken cancellationToken = default
    );
}

public sealed class HttpShippingRatesClient(HttpClient httpClient) : IShippingRatesClient
{
    public async Task<ShippingRate?> GetShippingRateAsync(
        string countryCode,
        decimal weightInKg,
        CancellationToken cancellationToken = default
    )
    {
        var weight = weightInKg.ToString(CultureInfo.InvariantCulture);
        var url = $"rates?country={Uri.EscapeDataString(countryCode)}&weight={weight}";
        using var response = await httpClient.GetAsync(url, cancellationToken);
        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }

        response.EnsureSuccessStatusCode();
        var dto = await response.Content.ReadFromJsonAsync<ShippingRateResponse>(cancellationToken);
        return new ShippingRate(dto!.Carrier, dto.PriceInEuro);
    }

    private sealed record ShippingRateResponse(string Carrier, decimal PriceInEuro);
}
```

The `if` is not a business decision: it maps the web service's "not found" to the `null` the Core expects. Whether a missing shipping rate means "show an error" or "fall back to a flat rate" is decided in the Core.

## One per slice, not one per entity

There is one Humble Object per vertical slice per third-party system. This might look like a lot of small types at first, and the obvious alternative is the [Repository pattern](https://martinfowler.com/eaaCatalog/repository.html) as many codebases implement it: one abstraction per entity that collects every operation any feature ever needed.

```csharp
public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<List<Order>> GetPendingOrdersAsync(CancellationToken cancellationToken = default);
    Task<List<Order>> GetOrdersOfCustomerAsync(int customerId, CancellationToken cancellationToken = default);
    Task<int> CountOrdersAsync(OrderStatus status, CancellationToken cancellationToken = default);
    void Add(Order order);
    void Remove(Order order);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
```

This abstraction is shaped by the data, not by its consumers. That violates the [Dependency Inversion Principle](https://www.labri.fr/perso/clement/enseignements/ao/DIP.pdf), because the abstraction no longer belongs to the code that uses it, and the [Interface Segregation Principle](https://www.cs.utexas.edu/~fares/papers/ISP.pdf), because every consumer depends on members it does not need. The costs show up quickly:

- Every Test Double has to deal with the whole interface, even though the feature under test calls two of its members.
- Read-only features suddenly have access to `SaveChangesAsync`. You cannot tell from the constructor whether a feature writes.
- The transaction boundary is no longer obvious. Which feature commits what?
- The interface keeps growing, and changes to it touch features that have nothing to do with each other.

CHACK gives each feature its own abstraction instead:

```csharp
public interface ICancelOrderSession : IAsyncSession
{
    Task<Order?> GetOrderAsync(int orderId, CancellationToken cancellationToken = default);
}

public interface IOrderHistoryClient
{
    Task<List<OrderHistoryEntry>> GetOrderHistoryAsync(
        int customerId,
        int skip,
        int take,
        CancellationToken cancellationToken = default
    );
}
```

Two slices may share the same Humble Object, but only if they require exactly the same abstraction. When their needs diverge later, split it again - the abstraction belongs to the feature, not to the table.

### Sharing code without sharing abstractions

Separate Humble Objects do not mean duplicated code. When several Humble Objects need the same query, filter, projection, or mapping, extract it into a static method that each of them calls:

```csharp
public static class OrderQueries
{
    public static Task<Order?> LoadOrderWithLinesAsync(
        this AppDbContext dbContext,
        int orderId,
        CancellationToken cancellationToken
    ) =>
        dbContext
           .Orders
           .Include(order => order.Lines)
           .FirstOrDefaultAsync(order => order.Id == orderId, cancellationToken);
}

public sealed class EfCancelOrderSession(AppDbContext dbContext)
    : EfSession<AppDbContext>(dbContext), ICancelOrderSession
{
    public Task<Order?> GetOrderAsync(int orderId, CancellationToken cancellationToken = default) =>
        DbContext.LoadOrderWithLinesAsync(orderId, cancellationToken);
}
```

Place these methods according to the rules in [Vertical Slices](./vertical-slices.md#hierarchy-and-sharing): in the closest common parent of the slices that use them, or in a sibling folder named after the concept. A static method that performs I/O, like the one above, belongs to the Humble Object category. A static method that runs in memory - for example, an `Expression<Func<Order, OrderHistoryEntry>>` that several projections reuse - may belong to the Core.

## Guidelines

- **Decide Client or Session first.** If the Core needs to commit, it is a Session that derives from `IAsyncSession` and `EfSession<TDbContext>`. Otherwise, it is a Client.
- **Name it after the feature and the technology.** `IAddToDoItemSession` is the Core's abstraction, `EfAddToDoItemSession` its implementation. `IOrderQueueClient` and `EfOrderQueueClient` work the same way.
- **One method per interaction** with the third-party system.
- **I/O calls are asynchronous** and take a `CancellationToken` as the last parameter with a default value. Pass the token down from the caller - ASP.NET Core injects it into endpoints, and message handlers get one from their context. Synchronous I/O blocks a thread pool thread and invites thread starvation.
- **Attach and remove synchronously.** Methods that only add an entity to a `DbSet` or remove it do not hit the database, so they should not be asynchronous.
- **Call `SaveChangesAsync` exactly once per Session.** If a Session saves twice and the second call fails, half a business transaction is committed. If a feature genuinely needs several saves, take control of the transaction explicitly.
- **Never return `IQueryable<T>`.** Materialize inside the Humble Object. A query that leaves it is a query whose SQL is decided somewhere in the Core, executed at a point nobody can see, and impossible to replace faithfully with a Test Double.
- **Use `AsNoTracking` in Clients.** Nobody will save the entities a Client returns, so there is no reason to track changes on them.
- **Translate exceptions at the boundary.** Catch the exceptions of the data access technology that the Core needs to react to, and turn them into Core exceptions or results. Let everything else bubble up.
- **`AppDbContext` is a Humble Object, too.** It does not implement a Core abstraction, but it performs I/O and is therefore categorized like the Clients and Sessions that use it. It lives in a folder that is [not a slice](./vertical-slices.md#folders-that-are-not-slices), together with base classes like `EfSession<TDbContext>`.

To see how an endpoint uses a Session, how the Session is registered, and how a unit test replaces it with a Spy, read [Building Blocks of a Backend Feature](./building-blocks.md).
