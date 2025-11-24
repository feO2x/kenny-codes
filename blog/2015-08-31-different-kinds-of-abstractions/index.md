---
slug: 2015-08-31-different-kinds-of-abstractions
title: Abstractions, Abstractions… Different Kinds of Abstractions
authors: [feO2x]
tags: [csharp, software-design, encapsulation, polymorphism, object-oriented-programming, api-design]
---

In my video series on the Dependency Inversion Principle that you can [watch on YouTube now](https://www.youtube.com/watch?v=cF7WRPKm8-A&list=PLIMrZfX3DMVFM_8EgFXmfVhOUNfMvXLLt), I talk a lot about object-oriented abstractions and how we can use them to structure our code in a loosely coupled way. But I didn’t really specify what ‘Abstraction’ actually means in terms of Computer Science.

<!-- truncate -->

So, let’s find a definition for the term ‘Abstraction’ first. If you look on [Wikipedia](https://en.wikipedia.org/wiki/Abstraction_(computer_science)), you’ll find one by John V. Guttag from his book “Introduction to Computation and Programming Using Python”, stating:

> "The essence of abstractions is preserving information that is relevant in a given context, and forgetting information that is irrelevant in that context."

In a similar way, Robert C. Martin stated in his book “Agile Principles, Patterns, and Practices in C#”:

> Abstraction is the amplification of the essential and the elimination of the irrelevant.

Two quite broad definitions, don’t you think? Well, let’s have a look at some abstractions and see what they all have in common.

## Source code as an abstraction over machine code

I think the most important part of a software developer’s work is implementation, i.e. the creation of source code to make computers do what we want them to do. But computers actually do not understand the code we are writing – this code has to be transformed by e.g. a compiler or interpreter to be executed on the target platform. Thus source code is an abstraction over the actual machine code being executed.
This abstraction is so commonly used by software developers that most of us probably do not realize that it is, in fact, an abstraction. In my opinion, this is also enforced by the great debugging tools that our IDEs provide to us – usually we do not have to go down to the machine code level because we can just debug our source code if we found a defect. Also, you can write automated tests that are so expressive that if one fails, you immediately know which part of your code you have to fix. Your source code can even produce different machine code according to the platform it is executed on or compiled for, respectively – this is a really great achievement of engineering.

## Procedures as an abstraction over repetitive statements

While Imperative Programming mainly introduced Flow Control (i.e. the usage of loops and branching keywords like `for`, `if`, `else`, `break`, and `continue`) as an instrument for the software developer, the main purpose of Procedural Programming is, well, the merging of several statements into a single function / procedure. If you need to execute the same functionality at different locations in your code, you do not have to duplicate the corresponding statements several times – you just put them in a function and call it from the distinct locations.

The benefit is very clear: if you have to change this functionality, you just have to change it once in a single location, instead of twelve times, probably forgetting two other locations. This makes your code base smaller and easier to maintain.

## Encapsulation as an abstraction over intrinsic details

This abstraction is a little bit harder to understand than the last two ones and is one of the essential paradigms of Object-Orientation. The most important thing about encapsulation in my opinion is information hiding, i.e. the ability to hide details from client code which ultimately makes the API that the client uses easier to understand.

Information hiding can also be achieved with functions because they hide the different statements that are needed to solve a certain problem from the client. But objects offer even more possibilities to simplify an API because you can hold some of the needed values for a method to execute successfully in fields / member variables, so that the client caller does not have to specify them as parameter values. If you think only in terms of Procedural Programming, then often there are some functions that have a relatively long parameter list (maybe from around four to ten parameters) that the caller has to specify and some of these parameters are often values that have nothing to do with the actual context of the caller. Thus client code has to carry along these values with the actual relevant ones, which adds noise and decreases readability and
maintainability (one could fix that with global variables, but I hope you agree with me that they are a dangerous design choice because they can be accessed by any code at any time - they really are not a solution to this problem).

With objects in turn, you can hold these values that are unnecessary for the caller to know about, in private fields. The values for these fields can be injected through the constructor. Other methods can be called by client code only with the parameter values they really care about. If the client code does not need to instantiate the class, it can program against a very simple API tailored to solve a specific problem, which is the main purpose of Encapsulation.

## Polymorphic calls as an abstraction over dynamic branching

The other paradigm of Object-Orientation is the use of Polymorphism through the capabilities of Inheritance. This allows us to program not against a specific type of objects, but to a range of types of objects, because client calls are made against an abstract method of an interface or abstract base class, or against a virtual method. Through Inheritance, you can derive from this type of abstraction and exchange the functionality by either overriding an implemented method or providing an implementation for an abstract method. And this is in my opinion the greatest flexibility boost we get from Object-Orientation (this is actually the kind of abstraction that I discussed in my video series on the Dependency Inversion Principle).

Why? Because as developers, we often have to execute slightly different functionality in different situations, although the overall process is roughly the same. So, with Procedural Programming, how would you execute varying functionality in differing scenarios? I would use `if else` or `switch` statements in this case to analyze the current context and then branch to the correct function to execute. Why is this not the best thing to do? Because you violate the Open-Closed-Principle (OCP) stating that your code base should be open for extensions, but closed for modifications. In case you want to add a different scenario, you have to modify the `if else` statements. If you just use polymorphic calls, you would check the current situation, compose your object graph accordingly, and then just run your functionality as usual. This also allows you to inject objects into client code whose classes aren’t even written yet – and it eliminates large `if else` or `switch` blocks in your code. You gain a lot of freedom and flexibility as a developer.

So are objects the only way to achieve polymorphism? No, you can use e.g. function pointers (Delegates in C#) – they also are constructs that can point to different implementations at run time and essentially correspond to an interface or abstract base class with only one method. In fact, function pointers are the way to achieve Polymorphism in procedural languages like C. Put more than one function pointer into a `struct` and you have something similar like an object (if you think of it that way, then objects basically manage the function pointers to dynamically bound methods). Also, templates / generics can be used to make polymorphic calls (although the former is resolved at compile time).

## So why all these abstractions?

We just had a look at four different kinds of abstractions in Computer Science and there are a lot more I did not list in this post. We can see that each of these abstractions solves a different kind of problem and is applied in different scenarios than the others. The only thing they have in common is that **they simplify a certain situation for us developers and that they allow us to think in other orders of magnitude, to solve higher-level problems**. A good abstraction often changes the way we work, too. Do I really know which machine code is generated when I make a polymorphic call? Actually, I do not need to be familiar with that because it is completely handled for me. Well, until I end up in high computing and need to optimize a certain piece of code to run as fast as possible. Which leads us right to the Law of Leaky Abstractions.

## Why are abstractions leaky?

In 2002, Joel Spolsky wrote a famous post about every complex abstraction being leaky. [Please read his article](http://www.joelonsoftware.com/articles/LeakyAbstractions.html) (as well as the other ones on his blog), it’s very informative on the topic and an interesting read. His basic idea is that at some point, any abstraction becomes leaky, i.e. the user of the abstraction has to have a look under the covers, mainly for these points in my opinion:

    The abstraction does not work as expected – the programmer has to get in touch with the internals to identify how he can fix the problem.
    The abstraction is not as fast as it should be – the programmer has to get in touch with the internals to identify how some parts can execute quicker.
    The abstraction does not provide the required functionality – the programmer has to get in touch with the internals to extend it.

Of course there are other reasons why one would take a look under the covers of an abstraction, but I think those three points are the major ones to keep in mind.

## Things to consider when creating your own abstractions

I hope you have seen that abstractions in Computer Science can be just about anything: from source code to programming languages, frameworks and libraries, code generation, functions, flow control, lambdas, preprocessor macros, and many more things. It certainly does not only correspond to interfaces and abstract base classes in Object-Oriented Programming – “Abstraction” is rather a broad concept that can be applied in a lot of situations.

But are we at a point in time where we do not need any further abstractions? I would say the answer is a clear no. There are still a lot of repetitive processes in my daily coding life (and I think in yours, too), so I would encourage us all to keep track of what we are doing day by day and think about it so that we can find new or better abstractions, improving our development processes.

If you actually found a new abstraction and want to implement it, go for these goals:

- Make your abstraction easy to use. A really good abstraction even changes the way your users work and think.
- Make your abstraction reusable. If it can be applied in different contexts, this is a good sign that you found something general being dead useful.
- Make your abstraction extensible. Sooner or later, some users of your abstraction will look under the covers to add new features, so make their lives easier in the first place, otherwise they might be annoyed and turn away.
- Make your abstraction fast. This guarantees that it can be used in a wide range of scenarios. Also, allow the user to optimize it if he or she needs to (which goes into the realm of extensibility).
- Document your abstraction well. Make your Source Code expressive and provide high level documentation that describes the overall structure. My recommendation to you: use video documentation, if you can afford to produce them, because they offer a relaxed introduction to the topic – just lean back and watch.

I hope you got a better understanding what the term “Abstraction” actually means. It is a broad concept that does not only apply to software development – it is just how our brains want to work when we improve things or venture into new areas. We focus on the things that we think are important and de-emphasize all the other stuff. Now go out and find us some great abstractions to work with 🙂
