---
sidebar_position: 3
title: Clients and Sessions in .NET
image: /img/social-cards/docs-chack-dotnet-clients-and-sessions.jpg
---

# Clients and Sessions in .NET

In .NET, [Clients and Sessions](../clients-and-sessions.md) are most commonly backed by Entity Framework Core or `HttpClient`. If you have not read the methodology page yet, start there for the conceptual distinction between Clients and Sessions and why each vertical slice gets its own Humble Object.

## The base abstractions

Because every Session commits the same way, they can share a small base interface:

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

:::info[ISession in ASP.NET Core projects]
ASP.NET Core defines its own `ISession` interface for HTTP session state, and the Web SDK imports `Microsoft.AspNetCore.Http` implicitly. When both namespaces are in scope, the compiler reports an ambiguous reference. Resolve it once for the whole project with a global using alias:

```csharp
global using ISession = MyApp.DatabaseAccess.ISession;
```

Better yet: disable Implicit Usings and you won't face this problem.
:::

## Why the abstractions are disposable

A Client or Session owns its connection to the third-party system and possibly an open transaction. Because callers only depend on the interface, `IAsyncDisposable` belongs on the abstraction itself rather than just the concrete class.

In an ASP.NET Core application, you rarely call `DisposeAsync` yourself: register Clients and Sessions as scoped services and the DI container disposes them at the end of the request. Without a container, such as in a console tool that imports data, the caller disposes the Session directly:

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

Clients disable change tracking by default because nobody saves the entities they return. Sessions enable it so Entity Framework Core can track updates for `SaveChangesAsync`.

The Client or Session disposes its `DbContext` because it owns it. When the DI container creates the context as a scoped service, the container disposes it again at the end of the scope, which is safe because `DbContext.Dispose` and `DisposeAsync` are idempotent.

## Implementing a Session

With the base class handling setup and disposal, a feature's Session only implements its own database operations. The `Ef` prefix indicates which technology backs the abstraction:

```csharp
public sealed class EfAddToDoItemSession(AppDbContext dbContext)
    : EfSession<AppDbContext>(dbContext), IAddToDoItemSession
{
    public void AddToDoItem(ToDoItem item) => DbContext.ToDoItems.Add(item);
}
```

Notice there is no explicit rollback call. Entity Framework Core tracks changes in memory and only executes SQL inside `SaveChangesAsync` within a transaction. If the Session is disposed before `SaveChangesAsync` runs, nothing is ever written to the database.

## Implementing a Client

A Client that reads from the database looks very similar, without a commit method:

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

One database query and a projection - nothing else. Because Entity Framework Core translates the projection directly into SQL, cover it with the feature's Integration Tests rather than Unit Tests.

Clients are not limited to databases. A typed `HttpClient` calling a web service is a Client, too:

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

This Client owns no unmanaged resources because `IHttpClientFactory` manages the underlying connections. As a result, the interface does not need to inherit `IAsyncDisposable`. [The Composition Root in .NET](./composition-root.md#registering-http-clients) shows how to register it.

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

This Client doesn't derive from `EfClient<TDbContext>`, because it has to dispose its transaction before the `DbContext`, and the base class doesn't know about the transaction. The [ready-made base types](#ready-made-base-types) at the end of this page take care of both.

Which isolation level makes several reads agree depends on your database. On PostgreSQL, Repeatable Read works on a snapshot taken at the first query, so the report above sees one consistent state. On SQL Server, Repeatable Read still lets rows appear that were inserted in between; there, you'd choose `IsolationLevel.Snapshot`, after enabling snapshot isolation for the database.

Disposing an uncommitted transaction rolls it back, which is the right behavior for a read-only Client. A Session can follow the same pattern when it needs a specific isolation level: begin the transaction lazily, commit it in `SaveChangesAsync` after saving changes, and dispose it at the end. Keep the cost of open transactions in mind (see the [methodology page](../clients-and-sessions.md#who-controls-the-transaction)).

## One per slice, not one per entity

Compare a typical entity-wide Repository interface:

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

with two feature-specific abstractions - one for canceling an order, and one for reading a customer's order history:

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
- **Never let `IQueryable<T>` leave a Humble Object.** Once a caller composes onto the query, the Core decides which SQL runs, and execution moves outside the Humble Object where a Test Double cannot reproduce database query semantics. Return a `List<T>`, an array, or a DTO instead.
- **Translate exceptions the Core cares about.** Entity Framework Core reports concurrency conflicts with `DbUpdateConcurrencyException`. When the Core needs to react to it, catch it in the Humble Object and map it to a Core exception or a result value. If several Sessions need the same handling, put it in a shared base class.
- **Register Clients and Sessions as scoped services.** They are not thread-safe, so a singleton is not an option. Because the DI container keeps transient disposables alive until the scope ends anyway, scoped registration reflects their actual lifetime. A typed `HttpClient` is the exception: `AddHttpClient` registers it as transient, which works because it owns nothing the scope needs to dispose.
- **Keep your `DbContext` outside feature slices.** It is a Humble Object, too, along with the base classes above. Place them in a [folder that is not a slice](../vertical-slices.md#folders-that-are-not-slices), like `DatabaseAccess`.

To see a Session wired into a full endpoint with a Module and Unit Tests, continue to [A Complete Slice in ASP.NET Core](./a-complete-slice.md).

## Ready-made base types

You don't have to write the base types on this page yourself:

- [Light.SharedCore](https://github.com/feO2x/Light.SharedCore) contains the `ISession` interface.
- [Light.DatabaseAccess.EntityFrameworkCore](https://github.com/feO2x/Light.DatabaseAccess.EntityFrameworkCore) contains `EfClient<TDbContext>` and `EfSession<TDbContext>`. Their nested classes `EfClient<TDbContext>.WithTransaction` and `EfSession<TDbContext>.WithTransaction` begin a transaction with the isolation level of your choice when it's first needed, commit it in `SaveChangesAsync`, and dispose it together with the `DbContext` - the lifetime transaction from above, without writing it yourself. All of them also offer `CreateCommandAsync` for the rare query that you'd rather write in plain ADO.NET.
