---
sidebar_position: 4
title: Testing in .NET
image: /img/social-cards/docs-chack-dotnet-testing.jpg
---

# Testing in .NET

This guide puts [Automated Tests](../automated-tests.mdx) into practice using xUnit v3, ASP.NET Core, and Testcontainers.

## Unit Tests

A Unit Test instantiates the endpoint with `new`, passes Test Doubles for the Humble Objects, and calls the endpoint method directly. [A Complete Slice in ASP.NET Core](./a-complete-slice.md#test-double-and-unit-tests) shows a full example.

A Unit Test never starts an application host (no `WebApplicationFactory<T>`, `WebApplication`, or generic host). If you want the DI container to assemble a larger object graph for a test, build a plain `ServiceCollection` in the setup phase: call the relevant Modules, swap the Humble Objects for Test Doubles, and resolve the endpoint from the service provider. The container acts only as part of the fixture, and the test still runs completely in memory.

## Test Doubles

Hand-written Test Doubles stay short in C# and make each double's role obvious. Two standard ones ship with .NET:

- `NullLogger<T>.Instance` is a Null Object.
- `FakeTimeProvider` from the `Microsoft.Extensions.TimeProvider.Testing` package is a Fake: it behaves like a real clock that your test can fix and advance.

With a mocking library like NSubstitute or Moq, the same substitute can act as a Stub, a Spy, or a Mock depending on how your test uses it: configuring return values, verifying received calls afterwards, or setting strict expectations upfront.

## Integration Tests

An Integration Test starts the application in-process with `WebApplicationFactory<Program>` and the real Composition Root, backed by real third-party systems started via Testcontainers.

### One container per test run

xUnit v3 lets you share a fixture across all test classes in an assembly. Use an assembly fixture to share both the database container and the test host across the suite:

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

Because all tests share one database instance, isolate each test's records using unique values:

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

xUnit runs test methods in an unspecified order. When one test builds on the outcome of another, declare the order explicitly with `[TestCaseOrderer]`. In many cases, though, a single multi-step test method is easier to follow: register the customer, place the order, and cancel it, asserting each step along the way.
