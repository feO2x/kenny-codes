---
sidebar_position: 2
title: The Core in .NET
image: /img/social-cards/docs-chack-dotnet-the-core.jpg
---

# The Core in .NET

This page shows how the ideas from [The Core](../the-core.mdx) translate to .NET: which types fit into the Core, where framework configuration goes, and how to keep time and other non-deterministic values under the control of your tests.

## Which .NET types fit into the Core?

The question is always the same: does the type perform I/O? Here's how that plays out for the types you'll meet most often.

Types that belong in the Core:

- Your entities, value objects, DTOs, validators, and services
- Result types like `TypedResults` and `Results<T1, T2>` from ASP.NET Core
- Options types, enums, and value types from frameworks, including Entity Framework Core
- `CancellationToken`
- `ILogger<T>` and `TimeProvider` - small abstractions designed to be replaced in tests (more on them below)

Types that perform I/O and belong in Humble Objects:

- `DbContext`, `DbSet<T>`, and queries built from them
- `HttpClient`
- `DbConnection`, `DbCommand`, and other ADO.NET types
- `File`, `Directory`, `FileStream`, and friends
- Clients for message brokers, object storage, and other SDKs that talk to another process

One type stays out for a different reason: `IServiceProvider`. A Core type that asks the container for its dependencies hides them from its constructor. When a Core type has to create objects at runtime, inject an abstract factory instead and implement it in the Composition Root.

## Keep attributes off your entities

`System.Text.Json` and Entity Framework Core both offer attributes like `[JsonPropertyName]`, `[Key]`, or `[MaxLength]`. Attributes are convenient, but they couple your entities directly to persistence and serialization details. Both frameworks also let you configure the same things in separate types, and that's the way CHACK suggests:

```csharp
public sealed class ToDoItemConfiguration : IEntityTypeConfiguration<ToDoItem>
{
    public void Configure(EntityTypeBuilder<ToDoItem> builder)
    {
        builder.HasKey(item => item.Id);
        builder.Property(item => item.Title).HasMaxLength(200).IsRequired();
    }
}
```

This configuration runs in memory, so it belongs to the Core even though it's all about persistence. The same applies to `JsonSerializerOptions` and custom `JsonConverter<T>` implementations. If a custom converter contains non-trivial logic, cover it with Unit Tests.

## Pipes and filters

Middleware, `IEndpointFilter` implementations, and MediatR pipeline behaviors belong to the Core as long as they don't perform I/O. When they need I/O, they call an I/O abstraction like any other Core type. Registering them and setting their order is the job of the Composition Root.

## Logging

`ILogger<T>` is the one I/O abstraction that the Core uses directly without a custom wrapper on top. It's small, designed for substitution, and ships with a built-in Null Object: pass `NullLogger<T>.Instance` in tests. When a test needs to assert on log output, write a small Spy implementing `ILogger<T>`.

## Time, GUIDs, and random numbers

`DateTime.UtcNow`, `DateTimeOffset.UtcNow`, `Guid.NewGuid()`, and `Random.Shared` return a different value on every call. To keep tests deterministic, inject them through abstractions instead:

- **Time:** inject `TimeProvider`. In production, the Composition Root registers `TimeProvider.System`; in tests, `FakeTimeProvider` from the `Microsoft.Extensions.TimeProvider.Testing` package lets you fix and advance time. [Light.SharedCore](https://github.com/feO2x/Light.SharedCore) offers `IClock` as a slimmer alternative.
- **GUIDs:** often the Core doesn't need to generate GUIDs at all - the client can pass one in the request, or the database can assign it. When the Core must generate one, inject a small abstraction like `Func<Guid>` or an `IIdGenerator`.
- **Random numbers:** inject a `Random` instance instead of using `Random.Shared`, so tests can pass one with a fixed seed.

## DTOs and validation

Design DTOs around what your business logic expects after validation, rather than making every property nullable just because a JSON deserializer could produce `null`. A `required` property or a record with a primary constructor makes that contract explicit, and the validator catches missing values at runtime.

A validator can also act as an [anti-corruption layer](../building-blocks.md#validators-as-an-anti-corruption-layer): instead of only reporting errors, it returns the validated domain object.

```csharp
public sealed record NewMovieDto(string Title, DateOnly? ReleaseDate);

public sealed class NewMovieDtoValidator
{
    public bool TryValidate(
        NewMovieDto dto,
        [NotNullWhen(true)] out Movie? movie,
        out Dictionary<string, string[]> errors
    )
    {
        errors = new Dictionary<string, string[]>();
        var title = dto.Title?.Trim();
        if (string.IsNullOrEmpty(title))
        {
            errors[nameof(dto.Title)] = ["The title must not be empty."];
        }
        else if (title.Length > Movie.MaximumTitleLength)
        {
            errors[nameof(dto.Title)] = [$"The title must not be longer than {Movie.MaximumTitleLength} characters."];
        }

        if (dto.ReleaseDate < Movie.MinimumReleaseDate)
        {
            errors[nameof(dto.ReleaseDate)] = ["The release date must not be before the invention of film."];
        }

        movie = errors.Count == 0 ? new Movie(title!, dto.ReleaseDate) : null;
        return movie is not null;
    }
}
```

The endpoint then continues with a `Movie` that is guaranteed to be valid, and it never touches `dto.Title` again.

Validation libraries keep the rules short and the error messages consistent. [FluentValidation](https://docs.fluentvalidation.net/) is a popular choice. [Light.PortableResults.Validation](https://github.com/feO2x/Light.PortableResults) supports the anti-corruption layer directly: derive your validator from `Validator<TSource, TValidated>`, and `Validate` returns either the errors or the domain object.

## Your `DbContext` is not part of the Core

Your `DbContext` subclass performs I/O, so it's a Humble Object - even though it doesn't implement an abstraction of the Core. [Clients and Sessions in .NET](./clients-and-sessions.md) shows how Clients and Sessions build on it.
