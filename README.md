# Sia

Sia - Binary serialisation and deserialisation with built-in compression

## Protocol specification - draft 1

This section describes the Sia binary data format. For each piece of item to be serialized,
Sia serializer outputs one or many blocks, these blocks contain the information
about the constructors of the items and arguments needed for reconstructing the items.

At binary and data format level, Sia supports 4 types of blocks, they are:

1. String: To store strings
2. Number: To store numeric values
3. Constructor: To store constructor names
4. Value: To store any other value

String is the simplest of the blocks, with no block type signature, for example, `"Hello world!"` will be serialized as:

```
Hello world!
```

For other blocks a type signature is required, as an example for number `42` the Sia serialisation is:

```
NUMBER 42
```

Where `NUMBER` is a single byte defined in `SIA_CONSTANTS` enum.
Please note white spaces aren't a part of the syntax, they're added here to enhance readability.

Constructor blocks contain the name of the constructor, for example for a Date object we have:

```
CONSTRUCTOR Date
```

Finally, for a value block we have:

```
VALUE constructorRef SEP argRefs
```

Where VALUE and SEP are single bytes defined in `SIA.CONSTANTS`,
constructorRef is the index of the constructor block in the serialized data,
and argRefs is a list of indexes to other blocks separated by `SEP`.

Each item is broken down into smaller pieces and is represented using only
constructor, string, number and value blocks, each block is separated from others
by a `SIA.TERMINATE` byte.

A Sia binary representation of `[42, 42, "Hello World"]` is:

```
CONSTRUCTOR Array TERMINATE
NUMBER 42 TERMINATE
Hello World TERMINATE
VALUE \0 SEP \1 SEP \1 SEP \2
```

Reading the above line by line (or block by block):

1. A constructor block of type `Array` is defined
2. A number block with value `42` is defined
3. A string block with value `Hello World` is defined
4. A value block, with `constructorRef = 0` is defined, where `0` refers to the `CONSTRUCTOR Array` block,
it contains three args: `\1`, `\1` and `\2`, which are references to other blocks.

As you have noticed, a value does not get serialized twice if it exists in the data twice, instead
it gets serialized once, and then gets referenced twice.

If we summarize the above:

1. Each Sia binary is made of several blocks, blocks are separated by `SIA_CONSTANTS.TERMINATE`.
2. There are 4 types of blocks: Number, String, Value and Constructor.
3. String blocks don't have a type indicator, they contain the string value.
4. Number blocks start with `SIA_CONSTANTS.NUMBER` then immediately a string representation of the number (eg. 1 instead of \1).
5. Constructor blocks start with `SIA_CONSTANTS.CONSTRUCTOR` then immediately a string representation of the constructor name
6. Value blocks start with `SIA_CONSTANTS.VALUE`, then immediately a constructor reference, then a `SIA_CONSTANTS.SEP`, and
then a `SIA_CONSTANTS.SEP` separated list of argument references.
7. Each reference, is the index of another block in the serialized data, this value is numeric (eg. \1 char instead of 1).

## Sia data exchange protocol specification - draft 1

Now that we've defined the Sia binary format, we need to define the data exchange protocol,
in other words we should agree how we're going to serialize common data types.

First we should agree on the symbols, here are the ones chosen for this draft:

| Symbol name | Byte value |
| ----------- | ---------- |
| TERMINATE   | 0          |
| SEP         | 1          |
| CONSTRUCTOR | 2          |
| VALUE       | 3          |
| NUMBER      | 4          |

References and certain integers (for example a unix timestamp) are represented as binary, encoded in base 254
and shifted by 2 in order to escape the `TERMINATE` and `SEP`:

```JavaScript
function encodeNumber(num) {
  const result = [];
  while (num > 0) {
    const R = num % 254;
    result.push(R + 2);
    num = (num - R) / 254;
  }
  return String.fromCharCode(...result);
}
```

The Sia data exchange protocol supports 9 basic data types, two of which have their own dedicated block types:

1. Number: represented in a number block
2. String: represented in a string block

The rest are value blocks:

| Constructor | Arguments |
| ----------- | --------- |
| Array       | `SEP` separated list of block references |
| Boolean     | `0` for false, `1` for true |
| Date        | Numeric value of unix timestamp (encoded number) |
| Null        | No arguments |
| Object      | `SEP` separated list of block references in form of `key1 value1 key2 value2...` |
| Regex       | `SEP` separated list of two items: source and flags |
| Undefined   | No arguments |
