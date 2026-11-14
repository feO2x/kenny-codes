---
sidebar_position: 4
title: Testing in .NET
---

# Testing in .NET

This page shows how the ideas from [Automated Tests](../automated-tests.mdx) look with xUnit, ASP.NET Core, and Testcontainers.

## Unit Tests

A Unit Test creates the endpoint with `new`, passes Test Doubles for the Humble Objects, and calls the endpoint method directly. [A Complete Slice in ASP.NET Core](./a-complete-slice.md#test-double-and-unit-tests) shows a full example.

## Test Doubles

Hand-written Test Doubles are short in C#, and they make the kind of a Test Double easy to see. Two of them come with .NET:

- `NullLogger<T>.Instance` is a Null Object.
- `FakeTimeProvider` from the `Microsoft.Extensions.TimeProvider.Testing` package is a Fake: it behaves like a real clock that the test sets and advances.

With a mocking library like NSubstitute or Moq, the same substitute can be a Stub, a Spy, or a Mock. What counts is how the test uses it: whether it configures return values, checks the received calls afterwards, or sets up strict expectations upfront.
