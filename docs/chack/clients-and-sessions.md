---
sidebar_position: 6
title: Clients and Sessions
image: /img/social-cards/docs-chack-clients-and-sessions.jpg
---

# Clients and Sessions

This page goes deeper into the Humble Objects that the Core calls. The general rules for all Humble Objects are on the [Humble Objects](./humble-objects.mdx) page.

## Who controls the transaction?

When the Core talks to a third-party system through a Humble Object, one question tells you what kind of Humble Object you are writing: **does the Core control a transaction?**

- A **Client** is used when the Core does not control transactions. The Core asks, the Client does the I/O, and the answer comes back. That doesn't mean a Client never uses transactions - it just never hands them to the Core. A transaction may live inside a single method, like a query that reads with Read Uncommitted. Or it may live as long as the Client itself: it begins when the Client is opened and ends when the Client is released. This is useful when several reads need to agree with each other. A report that loads orders and then their order lines should not stumble over an order whose lines were deleted in between.
- A **Session** is used when the Core does control a transaction. The Core loads data, changes it in memory, and decides when those changes become permanent. That's why a Session offers a method to commit. If the Core never calls it, nothing sticks: releasing a Session without committing rolls back all changes.

|                           | Client                                         | Session                                      |
|---------------------------|------------------------------------------------|----------------------------------------------|
| Who controls transactions | Nobody, or the Client internally               | The Core                                     |
| Commit method             | None                                           | One, usually called "save changes"           |
| Typical use               | Queries, web service calls, sending messages   | Features that change data in a database      |
| When released             | Ends its transaction, if it has one, and releases its resources | Rolls back everything that was not committed |

This also answers a question that comes up often: what about a Humble Object that only reads? If it offers no way to commit, it's a Client - even when it talks to the same database as the Sessions next to it.

Keeping a transaction open for the Client's whole lifetime is handy, and it has a price. While it's open, the Client holds on to its database connection, and the database keeps locks or old row versions around so that your reads see the same snapshot. Under load, other requests may have to wait, and the connection pool empties sooner. So it pays to keep the Client's lifetime short - one HTTP request or one message is a good fit - and to use a lifetime transaction only when your reads really need to agree.

You might wonder about writes. The Core never commits a Client's transaction, so a write inside it would either vanish on rollback or be committed silently when the Client is released. Neither is what you want, and that's exactly the situation a Session is made for.

## A Session is a Unit of Work

In [Patterns of Enterprise Application Architecture](https://martinfowler.com/books/eaa.html), Martin Fowler describes this kind of object as a [Unit of Work](https://martinfowler.com/eaaCatalog/unitOfWork.html). It takes care of three things:

- Keeping track of the objects affected during a business transaction (change tracking)
- Coordinating the writing out of those changes (DML generation)
- Resolving concurrency problems (database transactions or optimistic concurrency)

Many O/R mappers already implement all three. If you use one, your Session can stay thin: it offers exactly the operations one feature needs, named in the Core's vocabulary, and leaves the rest to the O/R mapper. With a plain database driver, the Session does a little more itself: it begins a transaction when it's opened, commits it in its commit method, and rolls it back when it's released without a commit.

Either way, a Session represents a transaction, so it also shows you at a glance where the transaction of a feature begins and ends.

## Releasing Clients and Sessions

A Client or Session usually owns a connection to its third-party system, and maybe a transaction, too. Whoever uses it has to be able to release it when the work is done - and the caller only knows the abstraction. That's why the release operation is part of the I/O abstraction, using whatever mechanism your language offers for it.

In an application with a DI container, you'll rarely call it yourself: the container releases the Client or Session together with the rest of the object graph, at the end of the request or message. But a Client or Session also works without a container. A small command-line tool can open a Session, add the records it imports, commit, and release the Session at the end - and if something goes wrong halfway through, releasing it rolls everything back.

A Humble Object that owns nothing it would have to release, say, a web service client whose connections are managed by the framework, doesn't need a release operation.

## One per slice, not one per entity

CHACK gives each vertical slice its own Humble Object per third-party system. At first, that can feel like a lot of small types, and a familiar alternative comes to mind: the [Repository pattern](https://martinfowler.com/eaaCatalog/repository.html) as many codebases implement it, with one abstraction per entity that gathers every operation any feature ever needed. An order repository might offer all of these:

- get an order by its ID
- get all pending orders
- get all orders of a customer
- count the orders with a given status
- add an order
- remove an order
- save changes

It feels convenient, but this abstraction is shaped by the data rather than by the code that uses it. In terms of principles, it no longer belongs to its consumer, as the [Dependency Inversion Principle](https://www.labri.fr/perso/clement/enseignements/ao/DIP.pdf) asks, and every consumer depends on members it doesn't need, which the [Interface Segregation Principle](https://www.cs.utexas.edu/~fares/papers/ISP.pdf) warns about. In your day-to-day work, you'd notice it like this:

- A Test Double has to implement the whole abstraction, even when the feature under test only calls two of its members.
- A read-only feature can save changes as well, so its dependencies no longer tell you whether it writes.
- It becomes harder to see which feature commits what, and where a transaction begins and ends.
- The abstraction keeps growing, and a change made for one feature touches the Test Doubles of many others.

When each feature gets its own abstraction, all of this stays small and visible:

| Abstraction             | Kind    | Members                                              |
|-------------------------|---------|------------------------------------------------------|
| `CancelOrderSession`    | Session | get an order with its lines, commit                  |
| `OrderHistoryClient`    | Client  | get a page of a customer's order history             |

Sometimes two slices really do need the same thing. They can share a Humble Object then, as long as they need exactly the same abstraction. If their needs drift apart later, you split it again - the abstraction follows the features, not the table.

### Sharing code without sharing abstractions

Separate Humble Objects don't have to mean duplicated code. When several of them need the same query, filter, projection, or mapping, you can move it into a static method and call it from each of them. Loading an order together with its lines is a typical example: both the Session that cancels an order and the Session that ships it can call the same method.

Where should such a method live? [Vertical Slices](./vertical-slices.md#hierarchy-and-sharing) has the answer: in the closest common parent of the slices that use it, or in a sibling folder named after the concept. A static method that performs I/O belongs to the Humble Object category. One that only runs in memory - say, a projection definition that several queries reuse - may belong to the Core.

## Guidelines

- **Start with the question: Client or Session?** If the Core needs to commit, you're writing a Session. Otherwise, it's a Client. Most of the other decisions follow from this one.
- **Name it after the feature and the technology.** `CancelOrderSession` is the Core's abstraction; its implementation carries the technology in its name, like `SqlCancelOrderSession`. The names then tell you what a feature needs and what fulfills it.
- **One method per interaction** with the third-party system. Each method stays easy to read, and each Test Double stays easy to write.
- **Make I/O calls asynchronous and cancellable** if your language and the data access technology support it. A thread that waits for I/O can't do anything else in the meantime.
- **Register changes without I/O.** With an O/R mapper, adding or removing an entity only registers the change with the Unit of Work. Such methods don't perform I/O, so they don't need to be asynchronous.
- **Commit once per Session.** One commit means one transaction: either the whole business transaction succeeds, or none of it does.
- **Materialize results inside the Humble Object.** When a deferred query leaves it, the Core ends up deciding which query runs, the query executes somewhere further away, and a Test Double can't imitate it faithfully. Returning a list or a DTO keeps all of that in one place.
- **Skip change tracking in Clients** if your O/R mapper supports it. Nobody saves the entities a Client returns.
- **Translate exceptions at the boundary.** When the Core needs to react to an exception of the data access technology - a concurrency conflict, for example - turn it into an exception or a result of the Core right here. Exceptions the Core can't do anything about can simply bubble up.
- **Your O/R mapper's context class is a Humble Object, too.** It doesn't implement a Core abstraction, but it performs I/O. A good home for it is a [folder that is not a slice](./vertical-slices.md#folders-that-are-not-slices), together with base types that your Clients and Sessions share.

If you'd like to see a Session in action - used by an endpoint, registered in a Module, and replaced by a Spy in a Unit Test - continue with [Building Blocks of a Backend Feature](./building-blocks.md).

:::tip[In .NET Practice]
[Clients and Sessions in .NET](./dotnet/clients-and-sessions.md) shows Clients and Sessions with Entity Framework Core and a typed HTTP client, including a transaction for a Client's whole lifetime.
:::
