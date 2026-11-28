---
sidebar_position: 5
title: The Composition Root in .NET
image: /img/social-cards/docs-chack-dotnet-composition-root.jpg
---

# The Composition Root in .NET

In ASP.NET Core, [The Composition Root](../composition-root.mdx) lives in `Program.cs` and delegates feature registrations to [Modules](../composition-root.mdx#modules).

## Register, Resolve, Release in ASP.NET Core

- **Register** is everything you do on the `WebApplicationBuilder` before you call `Build()`. After that, the service provider is fixed.
- **Resolve** and **Release** happen once per request: ASP.NET Core creates a service scope, resolves the endpoint and its dependencies from it, and disposes the scope when the response has been sent. Scoped and transient services that implement `IDisposable` or `IAsyncDisposable` are disposed along with it.
- In a `BackgroundService`, `IServiceScopeFactory` gives you the same cycle: create a scope per unit of work, resolve from it, and dispose it.

## Modules

A Module is a static class with an extension method on `IServiceCollection`. A leaf Module registers the types of its own folder:

```csharp
public static class CreateQueueItemModule
{
    public static IServiceCollection AddCreateQueueItemModule(this IServiceCollection services) =>
        services
           .AddSingleton<NewQueueItemDtoValidator>()
           .AddScoped<ICreateQueueItemSession, EfCreateQueueItemSession>()
           .AddScoped<CreateQueueItemEndpoint>();
}
```

A parent Module calls into its children:

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

The route mapping belongs to the Composition Root as well, so a Module can carry a second extension method on `IEndpointRouteBuilder` for it. [A Complete Slice in ASP.NET Core](./a-complete-slice.md#module) shows a Module with both.

At the top, `Program.cs` only calls the top-level Modules, together with the registrations that belong to the application as a whole:

```csharp
var builder = WebApplication.CreateBuilder(args);
builder
   .Services
   .AddSingleton(TimeProvider.System)
   .AddDatabaseAccessModule(builder.Configuration)
   .AddOrdersModule()
   .AddShippingModule();

var app = builder.Build();
app.MapOrdersEndpoints();
app.MapShippingEndpoints();
await app.RunAsync();
```

## Registering HTTP Clients

A Client that calls a web service, like the `HttpShippingRatesClient` from [Clients and Sessions in .NET](./clients-and-sessions.md#implementing-a-client), is registered as a typed `HttpClient`. `IHttpClientFactory` then manages the underlying connections, and the Module sets the base address from configuration:

```csharp
public sealed class ShippingRatesOptions
{
    public Uri BaseAddress { get; set; } = null!;
}

public static class ShippingRatesModule
{
    public static IServiceCollection AddShippingRatesModule(this IServiceCollection services)
    {
        services
           .AddOptions<ShippingRatesOptions>()
           .BindConfiguration("ShippingRates")
           .Validate(options => options.BaseAddress is not null, "ShippingRates:BaseAddress is missing.")
           .ValidateOnStart();
        services.AddHttpClient<IShippingRatesClient, HttpShippingRatesClient>(
            (serviceProvider, httpClient) =>
                httpClient.BaseAddress = serviceProvider
                   .GetRequiredService<IOptions<ShippingRatesOptions>>()
                   .Value
                   .BaseAddress
        );
        return services;
    }
}
```

Let the base address end with a slash, like `https://rates.example.com/api/`. Otherwise, the last segment is dropped when the Client appends a relative URL like `rates?country=DE`.

## Guidelines

- **Register Humble Objects against their Core abstraction:** `services.AddScoped<IPlaceOrderSession, EfPlaceOrderSession>()`. The Core only sees the interface; this registration line is the one place that wires in Entity Framework Core.
- **Get lifetimes right.** A scoped dependency captured by a singleton is the classic bug - it keeps a `DbContext` alive for the life of the process. ASP.NET Core validates scopes in the Development environment and reports this at startup, so it's worth leaving that on.
- **Bind configuration to options.** `services.Configure<ShippingOptions>(configuration.GetSection("Shipping"))` or `AddOptions<T>().Bind(...).ValidateOnStart()` binds settings into plain options objects. The Core receives them and doesn't need to know whether values came from `appsettings.json`, environment variables, or a secret store.
- **Run startup tasks before the app serves requests.** Database migrations or storage bucket setup can run in `Program.cs` between `Build()` and `RunAsync()`, in a scope of its own.
