[![Codacy Badge](https://app.codacy.com/project/badge/Grade/61f392c96c49481ba4c7d3f109db2fdc)](https://www.codacy.com/gh/pouya-eghbali/sia/dashboard?utm_source=github.com&utm_medium=referral&utm_content=pouya-eghbali/sia&utm_campaign=Badge_Grade)
[![codecov](https://codecov.io/gh/pouya-eghbali/sia/branch/master/graph/badge.svg?token=PCX0CJEW0A)](https://codecov.io/gh/pouya-eghbali/sia)

# Sia

Sia - Binary serialisation and deserialisation with built-in compression. You can consider Sia a strongly typed,
statically typed domain specific binary language for constructing data. Sia preserves data types and supports custom ones.

Please note the Sia specification and implementation isn't final yet. As a core part of
[Clio programming language](https://github.com/clio-lang/clio), Sia evolves with Clio. It is made to make
fast RPC calls possible.

## Why

I needed a fast schema-less serialization library that preserves type info and is able to code/decode custom types.
I couldn't find one. At first I wanted to go with a JSON with types solution but it didn't work out, so
I created my own.

## Performance

This repository contains a pure JS implementation of Sia, on our test data Sia is 66% to 1250% faster than JSON
and serialized data (including type information for all entries) is 10% to 30% smaller than JSON. Sia is faster
and smaller than MessagePack and CBOR/CBOR-X. It is possible to use lz4 to compress Sia generated data even more
and still be faster than JSON, MessagePack and CBOR-X.

![Sia](./fast.png)

Tests are run on a 2.4 GHz 8-Core Intel Core i9-9980HK CPU (5 GHz while running the benchmarks)
with 64 GB 2667 MHz DDR4 RAM. Node version 16.4.2, Mac OS 11.5.1. 100 loops each serialization library.
To run the benchmark suite you can run `npm run benchmark` and to run the tests you can run `npm run test`.

## Specification

Read [specs.md](specs.md).

## Install

To install the Node library and save it as a dependency, do:

```bash
npm i -S sializer
```

## Documentation

WIP

The Node Sia library exports 5 items:

```JavaScript
const { sia, desia, Sia, DeSia, constructors } = require("sializer");
```

- `sia(data)` function serializes the given data using the default parameters.
- `desia(buf)` function deserializes the given buffer using the default parameters.
- `Sia(options)` class makes an instance of Sia serializer using the given options.
- `DeSia(options)` class makes an instance of Sia deserializer using the given options.
- `constructors` is an array of default constructors used both by Sia and DeSia.

The `Sia` and `DeSia` objects are the core components of the Sia library.

### Basic usage

```JavaScript
const { sia, desia } = require("sializer");

const buf = sia(data);
const result = desia(buf);
```

### Sia class

```JavaScript
const sia = new Sia({
  size = 33554432, // Buffer size to use
  constructors = builtinConstructors // An array of extra classes and types
});

const buf = sia.serialize(data);
```

Where `size` is the maximum size of buffer to use, use a big size if you're expecting to
serialize huge objects. The `constructors` option is an array of extra types and classes,
it includes instructions for serializing the custom types and classes.

### DeSia class

```JavaScript
const desia = new DeSia({
  mapSize = 256 * 1000, // String map size
  constructors = builtinConstructors, // An array of extra classes and types
});

const data = desia.deserialize(buf);
```

Where `mapSize` is the minimum size of string map array to use, use a big size if you're
expecting to serialize huge objects. The `constructors` option is an array of extra types
and classes, it includes instructions for deserializing the custom types and classes.

### sia function

```JavaScript
const buf = sia(data);
```

The `sia` function is the `Sia.serialize` method on an instance initialized with the default options.

### desia function

```JavaScript
const data = desia(buf);
```

The `desia` function is the `DeSia.deserialize` method on an instance initialized with the default options.

### constructors

The `constructors` option is an array of extra types and classes that Sia should support.
Here's an example of how to use it:

```JavaScript
const { Sia, DeSia } = require("sializer");
const { constructors: builtins } = require("sializer");

const constructors = [
  ...builtins,
  {
    constructor: RegExp, // The custom class you want to support
    code: 7, // A unique positive code point for this class, the smaller the better
    args: (item) => [item.source, item.flags], // A function to serialize the instances of the class
    build(source, flags) { // A function for restoring instances of the class
      return new RegExp(source, flags);
    },
  },
];

const sia = new Sia({ constructors });
const desia = new DeSia({ constructors });

const regex = /[0-9]+/;
const buf = sia.serialize(regex); // serialize the data
const result = desia.deserialize(buf); // deserialize
```
