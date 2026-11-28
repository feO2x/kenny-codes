---
sidebar_position: 6
title: Clients and Sessions
image: /img/social-cards/docs-chack-clients-and-sessions.jpg
---

# Clients and Sessions

This page goes deeper into the Humble Objects that the Core calls. For the general rules covering all Humble Objects, see [Humble Objects](./humble-objects.mdx).

## Who controls the transaction?

When the Core talks to a third-party system through a Humble Object, one question decides which kind you are writing: **does the Core control a transaction?**

- A **Client** is used when the Core doesn't control transactions. The Core asks, the Client does the I/O, and the answer comes back. A Client may still use a transaction internally - either scoped to a single query (for example, reading with Read Uncommitted) or spanning the Client's lifetime so multiple reads see a consistent snapshot. For instance, a report that loads orders and then their order lines needs both queries to read the same point in time so no order is left without its lines.
- A **Session** is used when the Core controls a transaction. The Core loads data, modifies it in memory, and explicitly commits once all rules pass. Every Session exposes a commit method; if the Core never calls it, nothing sticks - releasing a Session without committing rolls back all changes.

|                           | Client                                         | Session                                      |
|---------------------------|------------------------------------------------|----------------------------------------------|
| Who controls transactions | Nobody, or the Client internally               | The Core                                     |
| Commit method             | None                                           | One, usually called "save changes"           |
| Typical use               | Queries, web service calls, sending messages   | Features that change data in a database      |
| When released             | Ends its transaction, if it has one, and releases its resources | Rolls back everything that was not committed |

A common question is what to call a Humble Object that only reads from the database. Without a commit method, it's a Client - even when it queries the same database as the Sessions next to it.

Keeping a transaction open for the Client's whole lifetime is handy, and it has a price. While it's open, the Client holds on to its database connection, and the database keeps locks or old row versions around so your reads see the same snapshot. Under load, other requests may wait longer and the connection pool drains faster. Keep the Client's lifetime short - scoped to one HTTP request or one message - and only open a lifetime transaction when multiple reads must see a consistent snapshot.

Don't write data inside a Client's transaction. The Core never commits it, so the write would either be rolled back or committed silently when the Client is disposed. If a feature changes data in a transaction, use a Session.

## A Session is a Unit of Work

In [Patterns of Enterprise Application Architecture](https://martinfowler.com/books/eaa.html), Martin Fowler describes this kind of object as a [Unit of Work](https://martinfowler.com/eaaCatalog/unitOfWork.html). It takes care of three things:

- Keeping track of the objects affected during a business transaction (change tracking)
- Coordinating the writing out of those changes (DML generation)
- Resolving concurrency problems (database transactions or optimistic concurrency)

Many O/R mappers already implement all three. With one in place, your Session stays thin: it exposes only the operations one feature needs, named in the Core's vocabulary, and delegates the rest to the O/R mapper. With a plain database driver, the Session handles the transaction explicitly: it opens a transaction on startup, commits it in the commit method, and rolls it back if disposed without a commit.

In both cases, a Session represents a transaction, so you can see where a feature's transaction begins and ends.

## Releasing Clients and Sessions

A Client or Session usually owns a connection to its third-party system and possibly a transaction. Because the caller only depends on the abstraction, include the release operation directly on the I/O abstraction (using your language's standard disposal mechanism) so callers can clean it up without knowing the concrete implementation.

In an application with a DI container, you'll rarely call it yourself: the container disposes the Client or Session together with the rest of the object graph at the end of the request or message. Clients and Sessions also work without a container. A small command-line tool can open a Session, add imported records, commit, and release the Session at the end - if something fails halfway through, releasing it rolls everything back.

A Humble Object that owns no unmanaged resources, such as a web service client whose connections are managed by the framework, doesn't need a release operation.

## One per slice, not one per entity

CHACK gives each vertical slice its own Humble Object per third-party system. At first glance, that can feel like too many small types, and many teams reach for the [Repository pattern](https://martinfowler.com/eaaCatalog/repository.html) instead: one interface per entity collecting every operation any feature has ever needed. An order repository might offer all of these:

- get an order by its ID
- get all pending orders
- get all orders of a customer
- count the orders with a given status
- add an order
- remove an order
- save changes

That feels convenient early on, but the interface is designed around the database table rather than the features calling it. It works against both the [Dependency Inversion Principle](https://www.labri.fr/perso/clement/enseignements/ao/DIP.pdf) (the abstraction is no longer owned by its consumer) and the [Interface Segregation Principle](https://www.cs.utexas.edu/~fares/papers/ISP.pdf) (every caller depends on methods it doesn't use). In practice, you run into these problems:

- Every Test Double has to implement the entire interface, even when the feature under test only calls two methods.
- A read-only feature gets access to `SaveChanges`, so its dependencies no longer reveal whether it writes data.
- It becomes harder to see which feature commits what and where a transaction begins and ends.
- The interface keeps growing, and adding a method for one feature forces updates to Test Doubles across unrelated features.

Giving each feature its own abstraction keeps interfaces small and explicit:

| Abstraction             | Kind    | Members                                              |
|-------------------------|---------|------------------------------------------------------|
| `CancelOrderSession`    | Session | get an order with its lines, commit                  |
| `OrderHistoryClient`    | Client  | get a page of a customer's order history             |

Sometimes two slices really do need the same operations. They can share a Humble Object as long as they need the exact same abstraction. If their needs diverge later, split them again so each abstraction matches its feature.

### Sharing code without sharing abstractions

Keeping Humble Objects separate doesn't mean duplicating code. When several of them need the same query, filter, projection, or mapping, extract it into a static method and call it from each Humble Object. Loading an order together with its lines is a common example: both the Session that cancels an order and the Session that ships it can call the same helper method.

Place shared helpers in the closest common parent of the slices that use them, or in a sibling folder named after the concept (see [Vertical Slices](./vertical-slices.md#hierarchy-and-sharing)). A static method that performs I/O belongs to the Humble Object category; one that runs purely in memory, such as a reusable projection expression, belongs to the Core.

## Guidelines

- **Start by deciding: Client or Session?** If the Core needs to commit, you're writing a Session. Otherwise, it's a Client.
- **Name it after the feature and the technology.** `CancelOrderSession` is the Core's abstraction; its implementation includes the technology in its name, such as `SqlCancelOrderSession`. The names tell you what a feature needs and how it's backed.
- **One method per interaction** with the third-party system. Each method stays easy to read, and each Test Double stays easy to write.
- **Make I/O calls asynchronous and cancellable** if your language and data access technology support it. Blocking a thread while waiting for I/O wastes capacity under load.
- **Register changes without I/O.** With an O/R mapper, adding or removing an entity only registers the change in the Unit of Work. Because those methods don't perform I/O, keep them synchronous.
- **Commit once per Session.** One commit means one transaction: either the whole business operation succeeds, or none of it does.
- **Materialize results inside the Humble Object.** If a deferred query leaves the Humble Object, the Core ends up adding to the query, execution moves outside the boundary, and a Test Double can't behave like the real database. Return a list, array, or DTO instead.
- **Skip change tracking in Clients** if your O/R mapper supports it. Nobody saves the entities a Client returns.
- **Translate exceptions at the boundary.** When the Core needs to react to a data-access exception (such as a concurrency conflict), map it to a Core exception or a result value right here. Exceptions the Core can't recover from can simply bubble up.
- **Your O/R mapper's context class is a Humble Object, too.** It doesn't implement a Core abstraction, but it performs I/O. Place it in a [folder that is not a slice](./vertical-slices.md#folders-that-are-not-slices), alongside base types shared by your Clients and Sessions.

To see a Session wired into an endpoint, registered in a Module, and replaced by a Spy in Unit Tests, continue to [Building Blocks of a Backend Feature](./building-blocks.md).

:::tip[In .NET Practice]
[Clients and Sessions in .NET](./dotnet/clients-and-sessions.md) shows Clients and Sessions with Entity Framework Core and a typed HTTP client, including a transaction for a Client's whole lifetime.
:::
