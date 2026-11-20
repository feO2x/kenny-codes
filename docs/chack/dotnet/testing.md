---
sidebar_position: 4
title: Testing in .NET
image: /img/social-cards/docs-chack-dotnet-testing.jpg
---

# Testing in .NET

This page shows how the ideas from [Automated Tests](../automated-tests.mdx) look with xUnit v3, ASP.NET Core, and Testcontainers.

## Unit Tests

A Unit Test creates the endpoint with `new`, passes Test Doubles for the Humble Objects, and calls the endpoint method directly. [A Complete Slice in ASP.NET Core](./a-complete-slice.md#test-double-and-unit-tests) shows a full example.

What a Unit Test doesn't do is start a host: no `WebApplicationFactory<T>`, no `WebApplication`, no generic host. If you'd like the DI container to build a larger object graph for you, a plain `ServiceCollection` in the setup phase is fine. Call the Modules you need, replace the Humble Objects with Test Doubles, and resolve the endpoint from the resulting service provider. The container is then part of the fixture, and the test still runs in memory.

## Test Doubles

Hand-written Test Doubles are short in C#, and they make the kind of a Test Double easy to see. Two of them come with .NET:

- `NullLogger<T>.Instance` is a Null Object.
- `FakeTimeProvider` from the `Microsoft.Extensions.TimeProvider.Testing` package is a Fake: it behaves like a real clock that the test sets and advances.

With a mocking library like NSubstitute or Moq, the same substitute can be a Stub, a Spy, or a Mock. What counts is how the test uses it: whether it configures return values, checks the received calls afterwards, or sets up strict expectations upfront.

## Integration Tests

An Integration Test starts the application in-process with `WebApplicationFactory<Program>` and the real Composition Root, and the third-party systems with Testcontainers.

### One container per test run

xUnit v3 can share a fixture across all test classes of an assembly. That's the right place for the container and the application:

```csharp
[assembly: AssemblyFixture(typeof(WebAppFixture))]

public sealed class WebAppFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:18").Build();

    public async ValueTask InitializeAsync() => await _postgres.StartAsync();

    public override async ValueTask DisposeAsync()
    {
        await base.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    // The host is built when the first test creates a client, after the container has started
    protected override void ConfigureWebHost(IWebHostBuilder builder) =>
        builder.UseSetting("ConnectionStrings:Postgres", _postgres.GetConnectionString());
}
```

The container starts once, before the first test that needs it, and stops after the last one. Every test class receives the fixture through its constructor. With `IClassFixture<T>`, you'd get a container per test class instead, and your test run would get slower with every class you add.

### A test with its own data

Since all tests share the database, each one works with data that only it knows about. A unique value is often enough:

```csharp
public sealed class AddToDoItemIntegrationTests(WebAppFixture fixture)
{
    [Fact]
    public async Task AddToDoItem()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var title = $"Write the CHACK docs {Guid.NewGuid()}";
        using var httpClient = fixture.CreateClient();

        using var response = await httpClient.PostAsJsonAsync(
            "/api/to-do-items",
            new NewToDoItemDto(title),
            cancellationToken
        );

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var id = await response.Content.ReadFromJsonAsync<int>(cancellationToken);
        await using var scope = fixture.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var item = await dbContext.ToDoItems.SingleAsync(toDoItem => toDoItem.Id == id, cancellationToken);
        Assert.Equal(title, item.Title);
    }
}
```

The test goes through the whole feature - routing, deserialization, the endpoint, the Session, the database mapping - and checks the happy path. The edge cases stay with the Unit Tests.

### Scenarios that proceed step by step

xUnit runs the tests of a class in an unspecified order. When one test builds on the outcome of another, you can make the order explicit with a test case orderer, applied via `[TestCaseOrderer]`. Often, though, a single test method with several steps tells the story more clearly: it registers the customer, places the order, and cancels it, checking the result of each step along the way.
