---
sidebar_position: 7
title: Data Access Sessions
---

# Data Access Sessions

:::note[A worked example]
This page is .NET throughout. It shows the most common humble object in a Line-of-Business application - the one that talks to the database - and how it doubles as a Unit of Work. The [Humble Objects](./humble-objects.mdx) page holds the language-neutral rules.
:::

## A session is a humble object and a Unit of Work

A database session is a special kind of humble object: besides performing I/O, it usually represents a single transaction. We use sessions to decouple the [Core](./the-core.mdx) from data access.

When Entity Framework Core is your data access technology, a session is effectively a [Unit of Work](https://martinfowler.com/eaaCatalog/unitOfWork.html). According to [Patterns of Enterprise Application Architecture](https://martinfowler.com/books/eaa.html), a Unit of Work handles three things:

- Keeping track of the objects affected during a business transaction (change tracking)
- Coordinating the writing out of those changes (DML generation)
- Resolving concurrency problems (database transactions or optimistic concurrency)

`DbContext` already implements all three, so a session becomes a thin, purposeful layer between the Core and EF Core: it exposes exactly the operations one use case needs, in the Core's vocabulary, and nothing else.

## To save, or not to save

We distinguish two kinds of sessions:

- **Read-only sessions** load data. They need no `SaveChangesAsync`, and their abstraction should not offer one - a use case that cannot write should not be able to.
- **Regular sessions** manipulate data. They expose `SaveChangesAsync` to commit their changes inside a database transaction. The default isolation level is usually read-committed; where a use case needs a different one, set it when the session is constructed.

A read-only session can still support transactions - reading uncommitted data is a rare but real requirement. The isolation level itself is normally nothing the Core needs to know about.

## Designing the abstraction

The Core programs against an interface that describes what one use case needs. In its purest form, an "add to-do item" session looks like this:

```csharp
public interface IAddToDoItemSession : IAsyncDisposable, IDisposable
{
    void AddToDoItem(ToDoItem item);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
```

Every session shares part of that shape, so pull it into two base interfaces:

```csharp
public interface IAsyncReadOnlySession : IAsyncDisposable, IDisposable { }

public interface IAsyncSession : IAsyncReadOnlySession
{
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
```

The use case abstraction then carries only what is specific to it:

```csharp
public interface IAddToDoItemSession : IAsyncSession
{
    void AddToDoItem(ToDoItem item);
}
```

A read-only example - the queue of pending orders:

```csharp
public interface IOrderQueueSession : IAsyncReadOnlySession
{
    Task<List<OrderQueueEntry>> GetOrderQueueAsync(CancellationToken cancellationToken = default);
}
```

No `SaveChangesAsync`, because this use case does not write.

## Implementing a session

A direct implementation, prefixed with `Ef` to say which technology is behind it:

```csharp
public sealed class EfAddToDoItemSession : IAddToDoItemSession
{
    private readonly AppDbContext _dbContext;

    public EfAddToDoItemSession(AppDbContext dbContext) => _dbContext = dbContext;

    public void AddToDoItem(ToDoItem item) => _dbContext.ToDoItems.Add(item);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _dbContext.SaveChangesAsync(cancellationToken);

    public ValueTask DisposeAsync() => _dbContext.DisposeAsync();

    public void Dispose() => _dbContext.Dispose();
}
```

Disposal and saving are the same in every session, so they belong in base classes:

```csharp
public abstract class EfAsyncReadOnlySession<TDbContext> : IAsyncReadOnlySession
    where TDbContext : DbContext
{
    protected EfAsyncReadOnlySession(TDbContext dbContext) => DbContext = dbContext;

    protected TDbContext DbContext { get; }

    public ValueTask DisposeAsync() => DbContext.DisposeAsync();

    public void Dispose() => DbContext.Dispose();
}

public abstract class EfAsyncSession<TDbContext> : EfAsyncReadOnlySession<TDbContext>, IAsyncSession
    where TDbContext : DbContext
{
    protected EfAsyncSession(TDbContext dbContext) : base(dbContext) { }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        DbContext.SaveChangesAsync(cancellationToken);
}
```

Which reduces the implementation to the one thing that is actually specific to this use case:

```csharp
public sealed class EfAddToDoItemSession : EfAsyncSession<AppDbContext>, IAddToDoItemSession
{
    public EfAddToDoItemSession(AppDbContext dbContext) : base(dbContext) { }

    public void AddToDoItem(ToDoItem item) => DbContext.ToDoItems.Add(item);
}
```

The read-only session derives from `EfAsyncReadOnlySession<TDbContext>` instead:

```csharp
public sealed class EfOrderQueueSession : EfAsyncReadOnlySession<AppDbContext>, IOrderQueueSession
{
    public EfOrderQueueSession(AppDbContext dbContext) : base(dbContext) { }

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

Notice what this method is: one I/O call plus a mapping - exactly the two jobs a humble object is allowed to have. The mapping here is written as a projection and executed by EF Core, so there is nothing to unit-test. When mapping is complex enough that you would want a test for it, move it into a public static method in the Core and call that instead.

## Guidelines

- **Decide read-only or not first.** Derive from `IAsyncSession` / `EfAsyncSession<TDbContext>` when the use case writes, and from `IAsyncReadOnlySession` / `EfAsyncReadOnlySession<TDbContext>` when it only reads.
- **One method per interaction** with the `DbContext`.
- **Database calls are asynchronous** and take a `CancellationToken` as the last parameter with a default value. Pass the token down from the caller - ASP.NET Core injects it into endpoints, and message handlers get one from their context. Synchronous I/O blocks a thread pool thread and invites thread starvation.
- **Attach and remove synchronously.** Methods that only add to or remove from a `DbSet` do not hit the database, so they should not be asynchronous.
- **Call `SaveChangesAsync` exactly once per session.** If a session saves twice and the second call fails, you are left with half a business transaction committed. If you genuinely need multiple saves, take control of the transaction explicitly.
- **Never return `IQueryable<T>`.** Materialize inside the session. A query that leaves the humble object is a query whose SQL is decided somewhere in the Core, executed at a point nobody can see, and impossible to replace with a test double faithfully.
- **Share code between sessions with static helper methods** when several implementations need the same query or projection.
- **Reuse a session** when two use cases need exactly the same members. If their needs diverge later, split them again - the abstraction belongs to the use case, not to the table.

## How the Core uses a session

The Core depends on the interface only, and the [Composition Root](./composition-root.mdx) decides what is behind it:

```csharp
public sealed class AddToDoItemEndpoint
{
    private readonly IAddToDoItemSession _session;
    private readonly NewToDoItemDtoValidator _validator;

    public AddToDoItemEndpoint(IAddToDoItemSession session, NewToDoItemDtoValidator validator)
    {
        _session = session;
        _validator = validator;
    }

    public async Task<IResult> AddToDoItemAsync(NewToDoItemDto dto, CancellationToken cancellationToken)
    {
        if (_validator.CheckForErrors(dto, out var errors))
            return Results.BadRequest(errors);

        var item = ToDoItem.FromDto(dto);
        _session.AddToDoItem(item);
        await _session.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/to-do-items/{item.Id}", item.Id);
    }
}
```

In a unit test, `IAddToDoItemSession` is replaced by a spy that records the item it was given - the validator is real, the mapping is real, and no database is involved. That is the whole point of the arrangement, and it is why the [unit tests aim at the endpoint](./automated-tests.mdx) rather than at the pieces below it.
