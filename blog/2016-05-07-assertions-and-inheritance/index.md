---
slug: 2016-05-07-assertions-and-inheritance
title: More on Design by Contract - Assertions and Inheritance
authors: [feO2x]
tags: [csharp, dotnet, design-by-contract, object-oriented-programming]
---

My previous two posts about Bertrand Meyer's Design by Contract (DbC) were mainly introductions to pre- and post-conditions and class invariants and how they can be implemented in C# – in this one we'll check out what implications DbC has if it is combined with the inheritance mechanism of object-oriented programming languages.

<!-- truncate -->

## TLDR;

When you place DbC assertions on a class and derive from it, you must respect them in subclasses or else you violate the LSP. This should result in more tests that are written against abstractions so that they can be shared across all test suites that exercise concrete implementations.

## Using the base class assertions in a subclass

In my previous examples, I showed you several pre- and post-conditions as well as class invariants for `List<T>`. Now consider that you would derive your own collection class from `List<T>` – what would happen to all the assertions that you have defined on this base class? Of course, the answer is: you have to make sure that you do not violate the base class's assertions in your subclass. Another example: if you have a base class `Car` that ensures that up to five people can sit in it, then you must not derive another class called `Porsche` from `Car` that reduces the number of people to two.

The reason why this is necessary is that while you might have changed the original behavior of the base class by deriving from it, instances of your subclass can still be accessed via a reference to the base class – and the client should not be aware of the actual type it is referencing (unless you really want to bloat your code). If you do not respect that, you essentially violate Liskov's Substitution Principle (LSP).

In fact, it's a little bit more complicated than I just described:

- **Pre-conditions can be softened in subclasses**: consider that a method in a base class accepts integer values between zero and ten. In your subclass, you are allowed to accept values from -2 to 15. The important thing is that the whole range of possible values of the base class is accepted in the subclass, and some more if you need to. On the contrary, you would break the LSP if you only allow a range from 5 to 7.
- **Post-conditions can be hardened in subclasses**: this ensures that the quality of a returned value or side effect is at least as good as the corresponding one of the base class, or even better.
- **Class invariants have to be untouched**: you cannot alter the class invariants of the base class as they are part of the pre- and post-conditions on every method call. If you harden them, you would violate the pre-conditions (because they can only be softened). If you soften them, you would violate the post-conditions (because they can only be hardened).

To be precise: you can always add new assertions in your subclass, but you must not alter existing ones in any other way than described in the list above, and you must not remove any assertions stated on the base class.

## This is where the real fun with DbC begins

But how can we use this knowledge when designing object-oriented components? Well if you rely heavily on SOLID code, then you decouple your different problem areas with interfaces or abstract base classes between them. Just put your DbC assertions on these and what you end up with are polymorphic abstractions that do not only specify which methods the concrete classes have to implement, but also define the semantic contracts that govern how these methods must behave.

Specifically, if we create a new interface, we should also write tests against this interface that exercise the pre- and post-conditions as well as the class invariants against the public API of the interface. The corresponding test class then should have an abstract factory method that creates the test target, so that classes testing concrete implementations of the abstraction can derive from it and thus inherit all the tests written against the abstraction. This way you can share the same tests for a number of classes that implement the same abstraction, and you only have to specify the tests that exercise additional behavior that is not included in the abstraction. (Of course, you can also solve this problem via composition instead of inheritance, although you probably will have a little more work to do with your test runners).
