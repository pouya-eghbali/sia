# Sia

Sia - Binary serialisation and deserialisation with built-in compression. You can consider Sia a strongly typed,
statically typed domain specific binary language for constructing data. Sia preserves data types and supports custom ones.

## Why?

I needed a fast schema-less serialization library that preserves type info and is able to code/decode custom types.
I couldn't find one. At first I wanted to go with a JSON with types solution but it didn't work out, so
I created my own.

## Performance

This repository contains a pure JS implementation of Sia, on our test data we are 30% to 40% faster than JSON
and serialized data (including type information for all entries) is 50% to 80% smaller than JSON. Sia is faster
and smaller than MessagePack and CBOR/CBOR-X.

![Sia](./fast.png)

Tests are run on a 2.4 GHz 8-Core Intel Core i9-9980HK CPU (5 GHz while running the benchmarks)
with 64 GB 2667 MHz DDR4 RAM. Node version 16.4.2, Mac OS 11.5.1. 100 loops each serialization library.
To run the benchmark suite you can run `npm run benchmark` and to run the tests you can run `npm run test`.

## Specification

Read [specs.md](specs.md).
