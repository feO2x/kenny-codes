---
sidebar_position: 6
title: A Complete Slice in ASP.NET Core
image: /img/social-cards/docs-chack-dotnet-a-complete-slice.jpg
---

# A Complete Slice in ASP.NET Core

Here is the full C# implementation of the to-do feature from [Building Blocks of a Backend Feature](../building-blocks.md), built with ASP.NET Core Minimal APIs, Entity Framework Core, and xUnit.

## The slice

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

`DatabaseAccess` contains the `AppDbContext`, the base classes from [Clients and Sessions in .NET](./clients-and-sessions.md), and the Module that registers the `AppDbContext`.

## Domain model

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

The entity checks its preconditions, so nobody can create it in an invalid state. It carries no attributes; its mapping lives in an `IEntityTypeConfiguration<ToDoItem>` (see [The Core in .NET](./the-core.md#keep-attributes-off-your-entities)). The database assigns the `Id` when the item is saved.

## Request DTO and validator

```csharp
public sealed record NewToDoItemDto(string Title);

public sealed class NewToDoItemDtoValidator
{
    public bool CheckForErrors(NewToDoItemDto dto, out Dictionary<string, string[]> errors)
    {
        errors = new Dictionary<string, string[]>();
        var title = dto.Title?.Trim();
        if (string.IsNullOrEmpty(title))
        {
            errors[nameof(dto.Title)] = ["The title must not be empty."];
        }
        else if (title.Length > 200)
        {
            errors[nameof(dto.Title)] = ["The title must not be longer than 200 characters."];
        }

        return errors.Count > 0;
    }
}
```

`Title` is declared non-nullable because that is what the business logic expects after validation. The deserializer may still produce `null`, and the validator catches it. In a production codebase, you would likely use a validation library like FluentValidation or Light.PortableResults.Validation; the hand-written version keeps this example self-contained.

## Session

The feature changes data, and the endpoint decides when to commit, so its Humble Object is a Session:

```csharp
public interface IAddToDoItemSession : ISession
{
    void AddToDoItem(ToDoItem item);
}

public sealed class EfAddToDoItemSession(AppDbContext dbContext)
    : EfSession<AppDbContext>(dbContext), IAddToDoItemSession
{
    public void AddToDoItem(ToDoItem item) => DbContext.ToDoItems.Add(item);
}
```

## Endpoint

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

Using `TypedResults` in the Core is fine because these result types run entirely in memory and can be asserted on directly in Unit Tests. The return type `Results<Created<int>, ValidationProblem>` also documents every response the endpoint can produce - both for readers and for OpenAPI generation.

## Module

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

The Module doesn't register `AppDbContext` or `TimeProvider`. The `DatabaseAccess` Module owns the first one, and `Program.cs` registers `TimeProvider.System`.

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

## Test Double and Unit Tests

To verify what the endpoint passed to the Session and whether it committed, we implement a Spy:

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

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;
}
```

The Unit Tests create the endpoint with `new` and call its method directly - no host, no HTTP:

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

`FakeTimeProvider` comes from the `Microsoft.Extensions.TimeProvider.Testing` package. Because these tests run entirely in memory, you can add as many edge and error cases as you need (such as an overly long title or a Session Stub that throws a concurrency exception) without noticeably slowing down the suite.

The happy-path Integration Test starts the application with `WebApplicationFactory<Program>` and PostgreSQL via Testcontainers, sends a `POST` request, and verifies that the item is persisted in the database. [Testing in .NET](./testing.md) shows how to set that up.
