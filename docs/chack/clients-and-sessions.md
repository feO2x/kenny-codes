---
sidebar_position: 6
title: Clients and Sessions
---

# Clients and Sessions

:::note[A worked example]
This page goes deeper into the Humble Objects that the Core calls, and the examples are .NET throughout: Entity Framework Core for database access and a typed `HttpClient` for a web service. The language-neutral rules are on the [Humble Objects](./humble-objects.mdx) page.
:::

## Who controls the transaction?

When the Core talks to a third-party system through a Humble Object, one question tells you what kind of Humble Object you are writing: **does the Core control a transaction?**

- A **Client** is used when the Core does not control transactions. The Core asks, the Client does the I/O, and the answer comes back. That doesn't mean a Client never uses transactions - it just never hands them to the Core. A transaction may live inside a single method, like a query that reads with Read Uncommitted. Or it may live as long as the Client itself: it begins when the Client is opened and ends when the Client is disposed. This is useful when several reads need to agree with each other. A report that loads orders and then their order lines should not stumble over an order whose lines were deleted in between.
- A **Session** is used when the Core does control a transaction. The Core loads data, changes it in memory, and decides when those changes become permanent. That's why a Session offers a method to commit, usually called `SaveChangesAsync`. If the Core never calls it, nothing sticks: disposing a Session without committing rolls back all changes.

|                           | Client                                         | Session                                      |
|---------------------------|------------------------------------------------|----------------------------------------------|
| Who controls transactions | Nobody, or the Client internally               | The Core                                     |
| Commit method             | None                                           | `SaveChangesAsync` or similar                |
| Typical use               | Queries, web service calls, sending messages   | Features that change data in a database      |
| When disposed             | Ends its transaction, if it has one, and releases its resources | Rolls back everything that was not committed |

This also answers a question that comes up often: what about a Humble Object that only reads? If it offers no way to commit, it's a Client - even when it talks to the same database as the Sessions next to it.

Keeping a transaction open for the Client's whole lifetime is handy, and it has a price. While it's open, the Client holds on to its database connection, and the database keeps locks or old row versions around so that your reads see the same snapshot. Under load, other requests may have to wait, and the connection pool empties sooner. So it pays to keep the Client's lifetime short - one HTTP request or one message is a good fit - and to use a lifetime transaction only when your reads really need to agree.

You might wonder about writes. The Core never commits a Client's transaction, so a write inside it would either vanish on rollback or be committed silently when the Client is disposed. Neither is what you want, and that's exactly the situation a Session is made for.

## A Session is a Unit of Work

In [Patterns of Enterprise Application Architecture](https://martinfowler.com/books/eaa.html), Martin Fowler describes this kind of object as a [Unit of Work](https://martinfowler.com/eaaCatalog/unitOfWork.html). It takes care of three things:

- Keeping track of the objects affected during a business transaction (change tracking)
- Coordinating the writing out of those changes (DML generation)
- Resolving concurrency problems (database transactions or optimistic concurrency)

If you use Entity Framework Core, you already have one: `DbContext` implements all three. Your Session can therefore stay thin. It offers exactly the operations one feature needs, named in the Core's vocabulary. And because a Session represents a transaction, it also shows you at a glance where the transaction of a feature begins and ends.

## Implementing a Session

Every Session can commit, so it makes sense to put that into a small base interface:

```csharp
public interface IAsyncSession
{
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
```

It's called `IAsyncSession` rather than `ISession` so that it doesn't collide with `Microsoft.AspNetCore.Http.ISession`. The abstraction of a feature then only adds what is specific to it:

```csharp
public interface IAddToDoItemSession : IAsyncSession
{
    void AddToDoItem(ToDoItem item);
}
```

Committing looks the same in every Session. So does a detail you'll want to handle in one place: EF Core reports a concurrency conflict with a `DbUpdateConcurrencyException`, and the Core shouldn't need to know that type. A base class takes care of both:

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

`ConcurrencyConflictException` lives in the Core. When it arrives, the Core can decide what makes sense for the feature - try again, report the conflict to the caller, or give up - without ever hearing about EF Core.

With the base class in place, the Session of a feature only contains what is truly its own. The `Ef` prefix tells you which technology sits behind the abstraction:

```csharp
public sealed class EfAddToDoItemSession(AppDbContext dbContext)
    : EfSession<AppDbContext>(dbContext), IAddToDoItemSession
{
    public void AddToDoItem(ToDoItem item) => DbContext.ToDoItems.Add(item);
}
```

You might be looking for the rollback. EF Core collects changes in memory and only writes them inside `SaveChangesAsync`, wrapped in a database transaction. So when a Session is disposed before anyone commits, the database simply never hears about the changes. If a feature needs an explicit transaction, for example with the Serializable isolation level, the Session can begin one with `DbContext.Database.BeginTransactionAsync`, commit it in `SaveChangesAsync`, and dispose it in its own `DisposeAsync`. A transaction that is disposed without being committed rolls back.

You may also notice that the Session doesn't dispose the `DbContext`. With `AddDbContext`, the DI container creates one `DbContext` per scope and disposes it when the scope ends. A helpful rule of thumb: whoever creates a resource also disposes it. If a Session creates its own `DbContext`, say through `IDbContextFactory<TDbContext>`, it owns that context and implements `IAsyncDisposable` to clean it up.

## Implementing a Client

A Client that reads from the database looks very similar - it just doesn't commit:

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

Take a look at what the method does: one I/O call and a mapping. That's exactly the job description of a Humble Object. The mapping is a projection that EF Core turns into SQL, so there's nothing here for a Unit Test to check. The Integration and End-to-End Tests of the feature cover it.

Clients aren't limited to databases. A typed `HttpClient` that calls a web service is a Client, too:

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

You may wonder whether the `if` is fine in a Humble Object. It is, because it's part of the mapping: it translates the web service's "not found" into the `null` that the Core expects. What a missing shipping rate *means* - show an error, or fall back to a flat rate - is still decided in the Core.

## One per slice, not one per entity

CHACK gives each vertical slice its own Humble Object per third-party system. At first, that can feel like a lot of small types, and a familiar alternative comes to mind: the [Repository pattern](https://martinfowler.com/eaaCatalog/repository.html) as many codebases implement it, with one abstraction per entity that gathers every operation any feature ever needed.

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

It feels convenient, but this abstraction is shaped by the data rather than by the code that uses it. In terms of principles, it no longer belongs to its consumer, as the [Dependency Inversion Principle](https://www.labri.fr/perso/clement/enseignements/ao/DIP.pdf) asks, and every consumer depends on members it doesn't need, which the [Interface Segregation Principle](https://www.cs.utexas.edu/~fares/papers/ISP.pdf) warns about. In your day-to-day work, you'd notice it like this:

- A Test Double has to implement the whole interface, even when the feature under test only calls two of its members.
- A read-only feature gets `SaveChangesAsync` as well, so its constructor no longer tells you whether it writes.
- It becomes harder to see which feature commits what, and where a transaction begins and ends.
- The interface keeps growing, and a change made for one feature touches the Test Doubles of many others.

When each feature gets its own abstraction, all of this stays small and visible:

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

Sometimes two slices really do need the same thing. They can share a Humble Object then, as long as they need exactly the same abstraction. If their needs drift apart later, you split it again - the abstraction follows the features, not the table.

### Sharing code without sharing abstractions

Separate Humble Objects don't have to mean duplicated code. When several of them need the same query, filter, projection, or mapping, you can move it into a static method and call it from each of them:

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

Where should such a method live? [Vertical Slices](./vertical-slices.md#hierarchy-and-sharing) has the answer: in the closest common parent of the slices that use it, or in a sibling folder named after the concept. A static method that performs I/O, like the one above, belongs to the Humble Object category. One that only runs in memory - say, an `Expression<Func<Order, OrderHistoryEntry>>` that several projections reuse - may belong to the Core.

## Guidelines

- **Start with the question: Client or Session?** If the Core needs to commit, you're writing a Session that derives from `IAsyncSession` and `EfSession<TDbContext>`. Otherwise, it's a Client. Most of the other decisions follow from this one.
- **Name it after the feature and the technology.** `IAddToDoItemSession` is the Core's abstraction, `EfAddToDoItemSession` its implementation; `IOrderQueueClient` and `EfOrderQueueClient` work the same way. The names then tell you what a feature needs and what fulfills it.
- **One method per interaction** with the third-party system. Each method stays easy to read, and each Test Double stays easy to write.
- **Make I/O calls asynchronous** and give them a `CancellationToken` as the last parameter with a default value. Pass the token on from the caller: ASP.NET Core injects one into endpoints, and message handlers get one from their context. Synchronous I/O blocks a thread pool thread while it waits, which can starve the thread pool under load.
- **Attach and remove synchronously.** Adding an entity to a `DbSet` or removing it doesn't hit the database yet, so these methods don't need to be asynchronous.
- **Call `SaveChangesAsync` once per Session.** One commit means one transaction: either the whole business transaction succeeds, or none of it does. If a feature really needs several saves, take control of the transaction explicitly so that this stays true.
- **Materialize results inside the Humble Object.** When an `IQueryable<T>` leaves it, the Core ends up deciding which SQL runs, the query executes somewhere further away, and a Test Double can't imitate it faithfully. Returning a `List<T>`, an array, or a DTO keeps all of that in one place.
- **Use `AsNoTracking` in Clients.** Nobody saves the entities a Client returns, so EF Core can skip change tracking for them.
- **Translate exceptions at the boundary.** When the Core needs to react to an exception of the data access technology, turn it into a Core exception or result right here. Exceptions the Core can't do anything about can simply bubble up.
- **Your `AppDbContext` is a Humble Object, too.** It doesn't implement a Core abstraction, but it performs I/O, so it belongs to the same category as the Clients and Sessions that use it. A good home for it is a [folder that is not a slice](./vertical-slices.md#folders-that-are-not-slices), together with base classes like `EfSession<TDbContext>`.

If you'd like to see a Session in action - used by an endpoint, registered in a Module, and replaced by a Spy in a Unit Test - continue with [Building Blocks of a Backend Feature](./building-blocks.md).
