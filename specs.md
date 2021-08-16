# Sia Specs

WIP

This document contains information about the Sia serialization protocol
and also the required features of the implementations.

## Sia protocol specification

### Binary format

Sia binary format is made out of smaller binary blocks.
Each block starts with a `uint8` value as the block identifier.
Sia uses the block identifier to detect the type of the block.
If the specified block type requires a hint,
the next few bytes of the block are the hint section of the block.
The size of the hint section is variable and can be set using the `hintSize` binary block.
Blocks can carry data, if the specified block requires a data section then the
remaining bytes in the block should be considered the data section of the block.

All blocks are little endian.

Examples:

```c
0x0
```

In the above binary sequence, `0x0` is the block identifier for `null`.
This block does not require a hint, nor does it require a data section.
The decoder should emit `null` for this block.

```c
0x5 0xDE 0xAD 0xBE 0xEF
```

In the above binary sequence, `0x5` is the block identifier for `uint32`.
Since the block length is known, this block does not require a hint,
but it does require a data section.
The remaining bytes `0xDEADBEEF` are the data required for initializing this block.

```c
0x28 0xC 0x48 0x65 0x6C 0x6C 0x6F 0x20 0x74 0x68 0x65 0x72 0x65 0x21
```

In the above binary sequence, `0x28` is the block identifier for `string`.
The next byte, `0xC` is the hint section of this block which contains the
length of the string. The remaining bytes are the data section of this block.

Check [types.csv](types.csv) for a list of all available types.

#### Special blocks

Some blocks, like `arrayStart` or `arrayEnd` blocks, are instruction blocks.
They might contain a hint section, but they do not have data sections.
