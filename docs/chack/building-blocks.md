---
sidebar_position: 7
title: Building Blocks of a Backend Feature
---

# Building Blocks of a Backend Feature

:::note[A worked example]
The overview below holds for any backend stack. The example code is .NET throughout: ASP.NET Core Minimal APIs, Entity Framework Core, and xUnit.
:::

## The building blocks

The four categories tell you where a piece of code belongs. In a backend feature - an HTTP endpoint, or a handler for a message from a broker - the same handful of building blocks keeps showing up:

| Building Block         | Category         | Description |
|------------------------|------------------|-------------|
| Endpoint               | Core             | Called directly by a framework to handle a request or a message. It receives the deserialized Request DTO and returns the response, if there is one. It is the preferred system under test of Unit Tests. |
| Request / Response DTO | Core             | Inputs and outputs of an endpoint. Incoming DTOs are untrusted until they are validated. Make them immutable where possible. |
| Validator              | Core             | Validates an incoming DTO. Called directly by the endpoint or the service. |
| Service                | Core             | Contains the main, orchestrating business logic of a feature. Only introduce one when the logic would overload the endpoint. |
| Domain Model           | Core             | Entities, value objects, and aggregates. Often shared between slices. |
| Client                 | Humble Object    | Performs I/O calls to a third-party system without exposing transaction control to the Core. |
| Session                | Humble Object    | Performs I/O calls to a third-party system within a transaction controlled by the Core. |
| Module                 | Composition Root | Registers the building blocks of a slice with the DI container and calls the Modules of its child slices. |
| Test Double            | Automated Tests  | Replaces a dependency of the system under test in a test. |

Not every feature needs all of them. A feature without input has no Request DTO and no validator; a feature with little logic has no service; a feature that does not touch a third-party system has neither a Client nor a Session. What matters is that each building block you do write belongs to exactly one category.

The mapping of a route or a message subscription to an endpoint is not part of the endpoint. It belongs to the [Composition Root](./composition-root.mdx) - in practice, often to the slice's Module.

## A complete slice

The example feature adds an item to a to-do list. Organized as a [vertical slice](./vertical-slices.md), it looks like this:

```text
📁 WebApp
|- 📁 CompositionRoot
|- 📁 DatabaseAccess
|- 📁 ToDoItems
   |- 📁 AddToDoItem
   |  |- 📄 AddToDoItemEndpoint.cs
   |  |- 📄 AddToDoItemModule.cs
   |  |- 📄 EfAddToDoItemSession.cs
   |  |- 📄 IAddToDoItemSession.cs
   |  |- 📄 NewToDoItemDto.cs
   |  |- 📄 NewToDoItemDtoValidator.cs
   |- 📄 ToDoItem.cs
   |- 📄 ToDoItemsModule.cs
```

`ToDoItem` sits in the parent folder because other slices below `ToDoItems` use it, too. `DatabaseAccess` is a [folder that is not a slice](./vertical-slices.md#folders-that-are-not-slices): it contains the `AppDbContext`, the `EfSession<TDbContext>` base class, and the Module that registers them.

### Domain model

```csharp
public sealed class ToDoItem
{
    private ToDoItem(string title, DateTimeOffset createdAtUtc)
    {
        Title = title;
        CreatedAtUtc = createdAtUtc;
    }

    public int Id { get; private set; }
    public string Title { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public bool IsDone { get; private set; }

    public static ToDoItem Create(string title, DateTimeOffset createdAtUtc)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        return new ToDoItem(title.Trim(), createdAtUtc);
    }

    public void MarkAsDone() => IsDone = true;
}
```

The entity checks its preconditions, so it cannot be created in an invalid state. It carries no serialization or O/R mapping attributes; how it is stored is configured elsewhere (see [Frameworks and Libraries](./the-core.mdx#frameworks-and-libraries)). The database assigns the `Id` when the item is saved.

### Request DTO and validator

```csharp
public sealed record NewToDoItemDto(string Title);

public sealed class NewToDoItemDtoValidator
{
    public bool CheckForErrors(NewToDoItemDto dto, out Dictionary<string, string[]> errors)
    {
        errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            errors[nameof(dto.Title)] = ["The title must not be empty."];
        }
        else if (dto.Title.Length > 200)
        {
            errors[nameof(dto.Title)] = ["The title must not be longer than 200 characters."];
        }

        return errors.Count > 0;
    }
}
```

The DTO is immutable and untrusted until the validator has checked it. `Title` is declared non-nullable because that is what the business logic needs after validation - the deserializer may still produce `null`, and the validator catches it. In a real codebase, you would write the validator with a library like [Light.PortableResults.Validation](https://github.com/feO2x/Light.PortableResults) or [FluentValidation](https://docs.fluentvalidation.net/). The hand-written version keeps the example free of library details.

### Session

The feature changes data, and the endpoint decides when to commit, so its Humble Object is a Session. [Clients and Sessions](./clients-and-sessions.md) explains `IAsyncSession` and `EfSession<TDbContext>`:

```csharp
public interface IAddToDoItemSession : IAsyncSession
{
    void AddToDoItem(ToDoItem item);
}

public sealed class EfAddToDoItemSession(AppDbContext dbContext)
    : EfSession<AppDbContext>(dbContext), IAddToDoItemSession
{
    public void AddToDoItem(ToDoItem item) => DbContext.ToDoItems.Add(item);
}
```

### Endpoint

```csharp
public sealed class AddToDoItemEndpoint(
    IAddToDoItemSession session,
    NewToDoItemDtoValidator validator,
    TimeProvider timeProvider
)
{
    public async Task<Results<Created<int>, ValidationProblem>> AddToDoItemAsync(
        NewToDoItemDto dto,
        CancellationToken cancellationToken = default
    )
    {
        if (validator.CheckForErrors(dto, out var errors))
        {
            return TypedResults.ValidationProblem(errors);
        }

        var item = ToDoItem.Create(dto.Title, timeProvider.GetUtcNow());
        session.AddToDoItem(item);
        await session.SaveChangesAsync(cancellationToken);
        return TypedResults.Created($"/api/to-do-items/{item.Id}", item.Id);
    }
}
```

A few things are worth pointing out:

- **The endpoint calls the validator directly.** Both are Core types, so there is no abstraction between them. One Unit Test covers both.
- **The current time comes from `TimeProvider`.** The endpoint does not call `DateTimeOffset.UtcNow` itself, so tests can control the time.
- **`TypedResults` is an ASP.NET Core type, and that is fine.** The result types run in memory and can be inspected in a test. The deciding criterion for the Core is I/O, not where a type comes from.
- **There is no service.** The logic is small enough to live in the endpoint. When it grows - several entities, rules that depend on each other, calls to more than one Humble Object - move it into an `AddToDoItemService` that the endpoint calls directly. The tests do not need to change, because they aim at the endpoint.

### Module

```csharp
public static class AddToDoItemModule
{
    public static IServiceCollection AddAddToDoItemModule(this IServiceCollection services) =>
        services
           .AddScoped<IAddToDoItemSession, EfAddToDoItemSession>()
           .AddSingleton<NewToDoItemDtoValidator>()
           .AddScoped<AddToDoItemEndpoint>();

    public static IEndpointRouteBuilder MapAddToDoItemEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost(
            "/api/to-do-items",
            (NewToDoItemDto dto, AddToDoItemEndpoint endpoint, CancellationToken cancellationToken) =>
                endpoint.AddToDoItemAsync(dto, cancellationToken)
        );
        return app;
    }
}
```

The Module physically lives in the slice folder, but it belongs to the Composition Root category. Look at what it does **not** register: `AppDbContext` and `TimeProvider`. The endpoint and the Session depend on them, but they are owned by other Modules - `AppDbContext` by the Module in `DatabaseAccess`, `TimeProvider.System` by the Composition Root itself. Registering them here would register them twice and make the result depend on the order in which the Modules are called. See [Modules](./composition-root.mdx#modules) for the rules.

The parent Module only calls into its children:

```csharp
public static class ToDoItemsModule
{
    public static IServiceCollection AddToDoItemsModule(this IServiceCollection services) =>
        services
           .AddAddToDoItemModule()
           .AddCompleteToDoItemModule()
           .AddGetToDoItemsModule();

    public static IEndpointRouteBuilder MapToDoItemsEndpoints(this IEndpointRouteBuilder app) =>
        app
           .MapAddToDoItemEndpoint()
           .MapCompleteToDoItemEndpoint()
           .MapGetToDoItemsEndpoint();
}
```

### Test Double and Unit Tests

The tests aim at the endpoint and let the real validator and the real domain model participate. Only the Session is replaced. The test needs to observe what the endpoint did with it, so the Test Double is a [Spy](./automated-tests.mdx#test-doubles) and is named like one:

```csharp
public sealed class AddToDoItemSessionSpy : IAddToDoItemSession
{
    public List<ToDoItem> AddedItems { get; } = [];
    public int SaveChangesCallCount { get; private set; }

    public void AddToDoItem(ToDoItem item) => AddedItems.Add(item);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SaveChangesCallCount++;
        return Task.CompletedTask;
    }
}
```

```csharp
public sealed class AddToDoItemEndpointTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 12, 9, 30, 0, TimeSpan.Zero);

    private readonly AddToDoItemSessionSpy _session = new();
    private readonly AddToDoItemEndpoint _endpoint;

    public AddToDoItemEndpointTests() =>
        _endpoint = new AddToDoItemEndpoint(_session, new NewToDoItemDtoValidator(), new FakeTimeProvider(Now));

    [Fact]
    public async Task AddToDoItemAsync_ValidDto_AddsItemAndCommits()
    {
        var result = await _endpoint.AddToDoItemAsync(new NewToDoItemDto("  Write the CHACK docs "));

        Assert.IsType<Created<int>>(result.Result);
        var item = Assert.Single(_session.AddedItems);
        Assert.Equal("Write the CHACK docs", item.Title);
        Assert.Equal(Now, item.CreatedAtUtc);
        Assert.Equal(1, _session.SaveChangesCallCount);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task AddToDoItemAsync_MissingTitle_ReturnsValidationProblemWithoutCommitting(string title)
    {
        var result = await _endpoint.AddToDoItemAsync(new NewToDoItemDto(title));

        Assert.IsType<ValidationProblem>(result.Result);
        Assert.Empty(_session.AddedItems);
        Assert.Equal(0, _session.SaveChangesCallCount);
    }
}
```

`FakeTimeProvider` comes from the `Microsoft.Extensions.TimeProvider.Testing` package. These tests never leave memory, so you can add dozens more for edge and error cases - a title that is too long, or a Session Stub that throws a `ConcurrencyConflictException` - without making the test suite noticeably slower.

What the Unit Tests cannot verify is whether `EfAddToDoItemSession`, the EF Core mapping, the Module, and the route mapping work together. That is the job of one Integration Test for the happy path: it starts the application in-process with `WebApplicationFactory<Program>` and the real Composition Root, starts PostgreSQL via [Testcontainers](https://testcontainers.com/), sends a `POST` request, and checks that the item ends up in the database. See [Automated Tests](./automated-tests.mdx) for the reasoning.
