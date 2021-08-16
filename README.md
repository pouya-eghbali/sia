[![Codacy Badge](https://app.codacy.com/project/badge/Grade/61f392c96c49481ba4c7d3f109db2fdc)](https://www.codacy.com/gh/pouya-eghbali/sia/dashboard?utm_source=github.com&utm_medium=referral&utm_content=pouya-eghbali/sia&utm_campaign=Badge_Grade)
[![codecov](https://codecov.io/gh/pouya-eghbali/sia/branch/master/graph/badge.svg?token=PCX0CJEW0A)](https://codecov.io/gh/pouya-eghbali/sia)

# Sia

Sia - Binary serialisation and deserialisation with built-in compression. You can consider Sia a strongly typed,
statically typed domain specific binary language for constructing data. Sia preserves data types and supports custom ones.

## Why

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

## Install

To install the Node library and save it as a dependency, do:

```bash
npm i -S sia-serializer
```

## Documentation

The Node Sia library exports 5 items:

```JavaScript
const { sia, desia, Sia, DeSia, constructors } = require("sia-serializer");
```

- `sia(data)` function serializes the given data using the default parameters.
- `desia(buf)` function deserializes the given buffer using the default parameters.
- `Sia(options)` class makes an instance of Sia serializer using the given options.
- `DeSia(options)` class makes an instance of Sia deserializer using the given options.
- `constructors` is an array of default constructors used both by Sia and DeSia.
