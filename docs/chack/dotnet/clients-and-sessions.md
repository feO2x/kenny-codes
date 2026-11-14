---
sidebar_position: 3
title: Clients and Sessions in .NET
---

# Clients and Sessions in .NET

This page shows how [Clients and Sessions](../clients-and-sessions.md) look with Entity Framework Core and `HttpClient`. If you haven't read the methodology page yet, it's a good place to start: it explains who controls the transaction, and why each slice gets its own Humble Object.

## The base abstractions

A Session lets the Core commit, and every Session does that the same way. That's why it makes sense to give them a common base interface:

```csharp
public interface ISession : IAsyncDisposable
{
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
```

The abstraction of a feature then only adds what is specific to it:

```csharp
public interface IAddToDoItemSession : ISession
{
    void AddToDoItem(ToDoItem item);
}
```

A Client has nothing to commit, so its abstraction derives from `IAsyncDisposable` directly:

```csharp
public interface IOrderQueueClient : IAsyncDisposable
{
    Task<List<OrderQueueEntry>> GetOrderQueueAsync(CancellationToken cancellationToken = default);
}
```

:::info[`ISession` in ASP.NET Core projects]
ASP.NET Core has an `ISession` interface of its own, for HTTP session state, and the Web SDK imports its namespace `Microsoft.AspNetCore.Http` implicitly. When a file sees both, the compiler can't tell them apart. A global using alias settles this once for the whole project:

```csharp
global using ISession = MyApp.DatabaseAccess.ISession;
```
:::

## Why the abstractions are disposable

A Client or Session owns its connection to the third-party system, and with it, possibly a transaction. Whoever uses it has to be able to release it - and the caller only sees the abstraction. That's why `IAsyncDisposable` is part of the abstraction rather than just the implementation.

In an ASP.NET Core application, you rarely notice this. You register Clients and Sessions as scoped services, and the container disposes them when the request ends. Without a container, the caller does it, for example in a console tool that imports data:

```csharp
await using var session = new EfImportProductsSession(new AppDbContext(options));
foreach (var product in products)
{
    session.AddProduct(product);
}

await session.SaveChangesAsync(cancellationToken);
```

If something throws before `SaveChangesAsync`, `await using` still disposes the Session, and nothing that was added reaches the database.

## Base classes for Entity Framework Core

Clients and Sessions that use Entity Framework Core all start the same way: they get a `DbContext`, set up change tracking, and dispose the context at the end. Two small base classes take care of that:

```csharp
public abstract class EfClient<TDbContext> : IAsyncDisposable, IDisposable
    where TDbContext : DbContext
{
    protected EfClient(
        TDbContext dbContext,
        QueryTrackingBehavior queryTrackingBehavior = QueryTrackingBehavior.NoTrackingWithIdentityResolution
    )
    {
        DbContext = dbContext;
        dbContext.ChangeTracker.QueryTrackingBehavior = queryTrackingBehavior;
    }

    public TDbContext DbContext { get; }

    public void Dispose() => DbContext.Dispose();

    public ValueTask DisposeAsync() => DbContext.DisposeAsync();
}

public abstract class EfSession<TDbContext> : EfClient<TDbContext>, ISession
    where TDbContext : DbContext
{
    protected EfSession(
        TDbContext dbContext,
        QueryTrackingBehavior queryTrackingBehavior = QueryTrackingBehavior.TrackAll
    )
        : base(dbContext, queryTrackingBehavior) { }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        DbContext.SaveChangesAsync(cancellationToken);
}
```

Clients don't track changes by default, because nobody saves the entities they return. Sessions do, because that's how Entity Framework Core finds out what to write.

The Client or Session disposes its `DbContext`, because it owns it. When the container created the context as a scoped service, it disposes it once more at the end of the scope, and that's fine: disposing a `DbContext` a second time does nothing.

## Implementing a Session

With the base class in place, the Session of a feature only contains what is truly its own. The `Ef` prefix tells you which technology sits behind the abstraction:

```csharp
public sealed class EfAddToDoItemSession(AppDbContext dbContext)
    : EfSession<AppDbContext>(dbContext), IAddToDoItemSession
{
    public void AddToDoItem(ToDoItem item) => DbContext.ToDoItems.Add(item);
}
```

You might be looking for the rollback. Entity Framework Core collects changes in memory and only writes them inside `SaveChangesAsync`, wrapped in a database transaction. So when a Session is disposed before anyone commits, the database simply never hears about the changes.

## Implementing a Client

A Client that reads from the database looks very similar - it just doesn't commit:

```csharp
public sealed class EfOrderQueueClient(AppDbContext dbContext)
    : EfClient<AppDbContext>(dbContext), IOrderQueueClient
{
    public Task<List<OrderQueueEntry>> GetOrderQueueAsync(CancellationToken cancellationToken = default) =>
        DbContext
           .Orders
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

One I/O call and a mapping - that's the whole job of a Humble Object. The mapping is a projection that Entity Framework Core turns into SQL, so there's nothing here for a Unit Test to check. The Integration Tests of the feature cover it.

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

This Client owns nothing that it would have to release: `IHttpClientFactory` manages the lifetime of the underlying connections. So here, the abstraction doesn't need to be disposable.

## A transaction for the Client's whole lifetime

Sometimes several reads have to agree with each other, like a report that loads orders and then their order lines. The Client can then begin a transaction with its first read and end it when it is disposed:

```csharp
public sealed class EfOrderReportClient(AppDbContext dbContext) : IOrderReportClient
{
    private IDbContextTransaction? _transaction;

    public async Task<List<OrderSummary>> GetOrdersAsync(DateOnly day, CancellationToken cancellationToken = default)
    {
        await EnsureTransactionAsync(cancellationToken);
        return await dbContext
           .Orders
           .Where(order => order.PlacedOn == day)
           .Select(order => new OrderSummary(order.Id, order.CustomerId))
           .ToListAsync(cancellationToken);
    }

    public async Task<List<OrderLineSummary>> GetOrderLinesAsync(
        List<int> orderIds,
        CancellationToken cancellationToken = default
    )
    {
        await EnsureTransactionAsync(cancellationToken);
        return await dbContext
           .OrderLines
           .Where(line => orderIds.Contains(line.OrderId))
           .Select(line => new OrderLineSummary(line.OrderId, line.ProductName, line.Quantity))
           .ToListAsync(cancellationToken);
    }

    private async Task EnsureTransactionAsync(CancellationToken cancellationToken) =>
        _transaction ??= await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.RepeatableRead,
            cancellationToken
        );

    public async ValueTask DisposeAsync()
    {
        if (_transaction is not null)
        {
            await _transaction.DisposeAsync();
        }

        await dbContext.DisposeAsync();
    }
}
```

Disposing a transaction that was never committed rolls it back, and for a Client that only reads, that's exactly right. A Session can work the same way when it needs a specific isolation level: it begins the transaction lazily, commits it in `SaveChangesAsync` after saving the changes, and disposes it at the end. Keep the cost of an open transaction in mind, which the [methodology page](../clients-and-sessions.md#who-controls-the-transaction) describes.

## One per slice, not one per entity

Here is the kind of Repository that CHACK replaces:

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

And here are two abstractions shaped by the features that use them - one that cancels an order, and one that shows a customer's order history:

```csharp
public interface ICancelOrderSession : ISession
{
    Task<Order?> GetOrderAsync(int orderId, CancellationToken cancellationToken = default);
}

public interface IOrderHistoryClient : IAsyncDisposable
{
    Task<List<OrderHistoryEntry>> GetOrderHistoryAsync(
        int customerId,
        int skip,
        int take,
        CancellationToken cancellationToken = default
    );
}
```

When several Humble Objects need the same query, it moves into a static method that each of them calls. An extension method on your `DbContext` reads nicely:

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

`OrderQueries` performs I/O, so it belongs to the Humble Object category. A reusable `Expression<Func<Order, OrderHistoryEntry>>` that several projections share only runs in memory and may belong to the Core.

## Guidelines

- **Make I/O methods asynchronous** and give them a `CancellationToken` as the last parameter, with a default value. Pass the token on from the caller: ASP.NET Core passes one to every endpoint, and message handlers get one from their context. Synchronous I/O blocks a thread pool thread while it waits, which can starve the thread pool under load.
- **Attach and remove synchronously.** Adding an entity to a `DbSet<T>` or removing it doesn't hit the database yet, so these methods don't need to be asynchronous.
- **Call `SaveChangesAsync` once per Session.** One commit means one transaction: either the whole business transaction succeeds, or none of it does.
- **Never let `IQueryable<T>` leave a Humble Object.** As soon as a caller adds to the query, the Core decides which SQL runs, and the query executes somewhere a Test Double can't imitate. Return a `List<T>`, an array, or a DTO instead.
- **Translate exceptions the Core cares about.** Entity Framework Core reports a concurrency conflict with a `DbUpdateConcurrencyException`. If the Core wants to react to it, catch it in the Humble Object and throw an exception of the Core, or return a result. If several Sessions need this, a base class of your own is a good home for it.
- **Register Clients and Sessions as scoped services.** They are not thread-safe, so a singleton is not an option. Transient disposable services are kept alive by the container until the scope ends anyway, so scoped says what actually happens.
- **Give your `DbContext` a home outside the slices.** It's a Humble Object, too, and so are the base classes above. A [folder that is not a slice](../vertical-slices.md#folders-that-are-not-slices), like `DatabaseAccess`, is a good place for them.

If you'd like to see a Session in action - used by an endpoint, registered in a Module, and replaced by a Spy in a Unit Test - continue with [A Complete Slice in ASP.NET Core](./a-complete-slice.md).

## Ready-made base types

You don't have to write the base types on this page yourself:

- [Light.SharedCore](https://github.com/feO2x/Light.SharedCore) contains the `ISession` interface.
- [Light.DatabaseAccess.EntityFrameworkCore](https://github.com/feO2x/Light.DatabaseAccess.EntityFrameworkCore) contains `EfClient<TDbContext>` and `EfSession<TDbContext>`. Their nested classes `EfClient<TDbContext>.WithTransaction` and `EfSession<TDbContext>.WithTransaction` begin a transaction with the isolation level of your choice when it's first needed, commit it in `SaveChangesAsync`, and dispose it together with the `DbContext` - the lifetime transaction from above, without writing it yourself. All of them also offer `CreateCommandAsync` for the rare query that you'd rather write in plain ADO.NET.
