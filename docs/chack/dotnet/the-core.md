---
sidebar_position: 2
title: The Core in .NET
---

# The Core in .NET

This page shows how the ideas from [The Core](../the-core.mdx) translate to .NET: which types fit into the Core, where framework configuration goes, and how to keep time and other non-deterministic values under the control of your tests.

## Which .NET types fit into the Core?

The question is always the same: does the type perform I/O? Here's how that plays out for the types you'll meet most often.

These are fine in the Core, because they run in memory:

- Your entities, value objects, DTOs, validators, and services
- Result types like `TypedResults` and `Results<T1, T2>` from ASP.NET Core
- Options types, enums, and value types of frameworks, including those of Entity Framework Core
- `CancellationToken`
- `ILogger<T>` and `TimeProvider` - small abstractions that are designed to be replaced in tests (more on them below)

These perform I/O, so they stay out of the Core and belong to Humble Objects:

- `DbContext`, `DbSet<T>`, and queries built from them
- `HttpClient`
- `DbConnection`, `DbCommand`, and the other ADO.NET types
- `File`, `Directory`, `FileStream`, and friends
- Clients of message brokers, object storages, and other SDKs that talk to another process

And one type stays out for a different reason: `IServiceProvider`. A Core type that asks the container for its dependencies hides them from its constructor. When a Core type really has to create objects at runtime, give it an abstract factory instead, and let the Composition Root implement it.

## Keep attributes off your entities

`System.Text.Json` and Entity Framework Core both offer attributes like `[JsonPropertyName]`, `[Key]`, or `[MaxLength]`. They are convenient, and they make your entities know how they are stored and transmitted. Both frameworks also let you configure the same things in separate types, and that's the way CHACK suggests:

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

This configuration runs in memory, so it belongs to the Core - even though it's all about persistence. The same goes for `JsonSerializerOptions` and custom `JsonConverter<T>` implementations. A converter with some logic in it is a good candidate for a Unit Test.

## Pipes and filters

Middleware, `IEndpointFilter` implementations, and MediatR pipeline behaviors are Core as long as they don't perform I/O. When they need I/O, they call an I/O abstraction like any other Core type. Registering them and deciding their order is the job of the Composition Root.

## Logging

`ILogger<T>` is the one I/O abstraction that the Core uses directly, without an abstraction of its own on top. It's small, it's made for substitution, and the framework ships a Null Object for it: in tests, pass `NullLogger<T>.Instance`. If a test wants to check what was logged, a small hand-written Spy that implements `ILogger<T>` does the job.

## Time, GUIDs, and random numbers

`DateTime.UtcNow`, `DateTimeOffset.UtcNow`, `Guid.NewGuid()`, and `Random.Shared` give a different value on every call. Here's how to let your tests decide them instead:

- **Time:** inject `TimeProvider`. In production, the Composition Root registers `TimeProvider.System`; in tests, `FakeTimeProvider` from the `Microsoft.Extensions.TimeProvider.Testing` package lets you set and advance the time. [Light.SharedCore](https://github.com/feO2x/Light.SharedCore) offers `IClock` as a slimmer alternative, if you prefer.
- **GUIDs:** often, the GUID doesn't have to be generated in the Core at all. A client can send it along with the request, or the database can assign it. When the Core does create one, a small abstraction of your own, like a `Func<Guid>` or an `IIdGenerator`, keeps it under control.
- **Random numbers:** inject a `Random` instance instead of using `Random.Shared`. A test can then pass one with a fixed seed.

## DTOs and validation

Design DTOs for what your business logic needs, not for what the deserializer might produce. If a property must not be `null` after validation, declare it as non-nullable and let the validator check it. A `required` property, or a record with a primary constructor, makes this explicit.

A validator can also act as an [anti-corruption layer](../building-blocks.md#validators-as-an-anti-corruption-layer): instead of only reporting errors, it hands back the domain object that the DTO describes.

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
