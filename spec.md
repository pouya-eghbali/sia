# Sia Specification

This document contains information about the Sia serialization protocol.
Sia is a block based, binary serialization format.
Each item is serialized into a block.
Each block starts with a single byte that defines the type of the block.
For certain types, a hint sequence of variable size follows the type byte.
Certain types have a "end" byte at the end of the block.
What comes between the start, hint and the end of the block is the data stored in that block.

This document was inspired by the MessagePack [spec](https://github.com/msgpack/msgpack/blob/master/spec.md) file.

## Types

Sia protocol supports the following types:

- Null (null)
- Undefined (undefined)
- Unsigned Int (uint8, uint16, uint32, uint64, uint128, uintN)
- Signed Int (int8, int16, int32, int64, int128, intN)
- Float (float8, float16, float32, float64, float128, floatN)
- Record (record)
- Reference (ref8, ref16, ref32, ref64, ref128, refN)
- UTFZ (utfz)
- String (string8, string16, string32, string64, string128, stringN)
- Binary (bin8, bin16, bin32m bin64, bin128, binN)
- Boolean (true, false)
- Date (date, date64)
- Constructor (constructor8, constructor16, constructor32)
- Array (array8, array16, array32, array64, array128)
- Object (objectStart, objectEnd)
- Set (setStart, setEnd)
- Map (mapStart, mapEnd)

Note: the `constructor` types are used to add custom types to Sia.
Note: the `record` and `reference` types are used for making a pointer to a value.

## Limitations and upper limits

- There is no limitation on the size of the integers, both signed and unsigned
- There is no limitation on the size of float
- There is no limitation on the size of references
- The maximum allowed length for UTFZ is 255
- There is no limitation on the size of strings
- There is no limitation on the size of binary
- The maximum allowed identifier for a constructor is `(2^32)-1`
- The maximum allowed length for arrays is `(2^128)-1`
- There is no limitation on the size of objects
- There is no limitation on the size of set
- There is no limitation on the size of map

## Type identifiers

The table below shows the identifier byte for each of the data types that Sia supports:

| Type name     | Decimal | Binary     | Hex  |
| ------------- | ------- | ---------- | ---- |
| null          | 0       | 0b00000000 | 0x0  |
| undefined     | 1       | 0b00000001 | 0x1  |
| uint8         | 2       | 0b00000010 | 0x2  |
| uint16        | 3       | 0b00000011 | 0x3  |
| uint32        | 4       | 0b00000100 | 0x4  |
| uint64        | 5       | 0b00000101 | 0x5  |
| uint128       | 6       | 0b00000110 | 0x6  |
| uintn         | 7       | 0b00000111 | 0x7  |
| int8          | 8       | 0b00001000 | 0x8  |
| int16         | 9       | 0b00001001 | 0x9  |
| int32         | 10      | 0b00001010 | 0xa  |
| int64         | 11      | 0b00001011 | 0xb  |
| int128        | 12      | 0b00001100 | 0xc  |
| intn          | 13      | 0b00001101 | 0xd  |
| float8        | 14      | 0b00001110 | 0xe  |
| float16       | 15      | 0b00001111 | 0xf  |
| float32       | 16      | 0b00010000 | 0x10 |
| float64       | 17      | 0b00010001 | 0x11 |
| float128      | 18      | 0b00010010 | 0x12 |
| floatn        | 19      | 0b00010011 | 0x13 |
| record        | 20      | 0b00010100 | 0x14 |
| ref8          | 21      | 0b00010101 | 0x15 |
| ref16         | 22      | 0b00010110 | 0x16 |
| ref32         | 23      | 0b00010111 | 0x17 |
| ref64         | 24      | 0b00011000 | 0x18 |
| ref128        | 25      | 0b00011001 | 0x19 |
| refn          | 26      | 0b00011010 | 0x1a |
| utfz          | 27      | 0b00011011 | 0x1b |
| string8       | 28      | 0b00011100 | 0x1c |
| string16      | 29      | 0b00011101 | 0x1d |
| string32      | 30      | 0b00011110 | 0x1e |
| string64      | 31      | 0b00011111 | 0x1f |
| string128     | 32      | 0b00100000 | 0x20 |
| stringn       | 33      | 0b00100001 | 0x21 |
| bin8          | 34      | 0b00100010 | 0x22 |
| bin16         | 35      | 0b00100011 | 0x23 |
| bin32         | 36      | 0b00100100 | 0x24 |
| bin64         | 37      | 0b00100101 | 0x25 |
| bin128        | 38      | 0b00100110 | 0x26 |
| binN          | 39      | 0b00100111 | 0x27 |
| true          | 40      | 0b00101000 | 0x28 |
| false         | 41      | 0b00101001 | 0x29 |
| date          | 42      | 0b00101010 | 0x2a |
| date64        | 43      | 0b00101011 | 0x2b |
| constructor8  | 44      | 0b00101100 | 0x2c |
| constructor16 | 45      | 0b00101101 | 0x2d |
| constructor32 | 46      | 0b00101110 | 0x2e |
| array8        | 47      | 0b00101111 | 0x2f |
| array16       | 48      | 0b00110000 | 0x30 |
| array32       | 49      | 0b00110001 | 0x31 |
| array64       | 50      | 0b00110010 | 0x32 |
| array128      | 51      | 0b00110011 | 0x33 |
| objectStart   | 52      | 0b00110100 | 0x34 |
| objectEnd     | 53      | 0b00110101 | 0x35 |
| setStart      | 54      | 0b00110110 | 0x36 |
| setEnd        | 55      | 0b00110111 | 0x37 |
| mapStart      | 56      | 0b00111000 | 0x38 |
| mapEnd        | 57      | 0b00111001 | 0x39 |

## Notation in diagrams

```
SIZE number of bytes:
+--------+
|        |
+--------+
[  SIZE  ]

variable number of objects stored in Sia format:
+~~~~~~~~~~~~~~~~~+
|                 |
+~~~~~~~~~~~~~~~~~+
```

## Block diagrams

### Null

```
null:
+-------+
|  0x0  |
+-------+
[   1   ]
```

The `null` block stores `Null` in 1 byte.

### Undefined

```
undefined:
+-------+
|  0x1  |
+-------+
[   1   ]
```

The `undefined` block stores `Undefined` in 1 byte.

### Unsigned Integers

```
uint8 stores a 8-bit unsigned integer
+-------+--------+
|  0x2  | Number |
+-------+--------+
[   1   ][   1   ]

uint16 stores a 16-bit little-endian unsigned integer
+-------+--------+
|  0x3  | Number |
+-------+--------+
[   1   ][   2   ]

uint32 stores a 32-bit little-endian unsigned integer
+-------+--------+
|  0x4  | Number |
+-------+--------+
[   1   ][   4   ]

uint64 stores a 64-bit little-endian unsigned integer
+-------+--------+
|  0x5  | Number |
+-------+--------+
[   1   ][   8   ]

uint128 stores a 128-bit little-endian unsigned integer
+-------+---------+
|  0x6  |  Number |
+-------+---------+
[   1   ][   16   ]

uintn stores a N-byte little-endian unsigned integer
+-------+--------+--------+
|  0x6  |    N   | Number |
+-------+--------+--------+
[   1   ][   1   ][   N   ]

```

### Signed Integers

```
int8 stores a 8-bit signed integer
+-------+--------+
|  0x7  | Number |
+-------+--------+
[   1   ][   1   ]

int16 stores a 16-bit little-endian signed integer
+-------+--------+
|  0x8  | Number |
+-------+--------+
[   1   ][   2   ]

int32 stores a 32-bit little-endian signed integer
+-------+--------+
|  0x9  | Number |
+-------+--------+
[   1   ][   4   ]

int64 stores a 64-bit little-endian signed integer
+-------+--------+
|  0xa  | Number |
+-------+--------+
[   1   ][   8   ]

int128 stores a 128-bit little-endian signed integer
+-------+----------+
|  0xb  |  Number  |
+-------+----------+
[   1   ][   16    ]

intn stores a N-byte little-endian signed integer
+-------+--------+--------+
|  0xc  |    N   | Number |
+-------+--------+--------+
[   1   ][   1   ][   N   ]
```

### Floats

```
float8 stores a 8-bit minifloat
+-------+--------+
|  0xe  | Number |
+-------+--------+
[   1   ][   1   ]

int16 stores a 16-bit minifloat
+-------+--------+
|  0xf  | Number |
+-------+--------+
[   1   ][   2   ]

float32 stores a single-precision 32-bit IEEE 754 float
+--------+--------+
|  0x10  | Number |
+--------+--------+
[   1    ][   4   ]

float64 stores a double-precision 64-bit IEEE 754 float
+--------+--------+
|  0x11  | Number |
+--------+--------+
[   1    ][   8   ]

float128 stores a quadruple-precision 128-bit IEEE 754 float
+--------+----------+
|  0x12  |  Number  |
+--------+----------+
[   1    ][   16    ]

floatn stores a N-byte floating point number
+--------+--------+--------+
|  0x13  |    N   | Number |
+--------+--------+--------+
[   1    ][   1   ][   N   ]

```

Check [Minifloat](https://en.wikipedia.org/wiki/Minifloat) article on Wikipedia for more information.

### Record

```
record:
+--------+
|  0x14  |
+--------+
[   1    ]
```

The `record` block instructs the deserializer to record the next block and increment the reference count.

### Reference

```
ref8 stores a 8-bit uint8 reference
+--------+--------+
|  0x15  | Number |
+--------+--------+
[   1    ][   1   ]

ref16 stores a 16-bit little-endian uint16 reference
+--------+--------+
|  0x16  | Number |
+--------+--------+
[   1    ][   2   ]

ref32 stores a 32-bit little-endian uint32 reference
+--------+--------+
|  0x17  | Number |
+--------+--------+
[   1    ][   4   ]

ref64 stores a 64-bit little-endian uint64 reference
+--------+--------+
|  0x18  | Number |
+--------+--------+
[   1    ][   8   ]

ref128 stores a 128-bit little-endian uint128 reference
+--------+----------+
|  0x19  |  Number  |
+--------+----------+
[   1    ][   16    ]

refn stores a N-byte little-endian reference
+--------+--------+--------+
|  0x1a  |    N   | Number |
+--------+--------+--------+
[   1    ][   1   ][   N   ]
```

A reference or pointer to a previously recorded block and it holds the record counter's value.
Note: Object keys are always recorded.

### UTFZ

```
utfz stores a utfz string with a maximum byte length of 255
+--------+--------+--------+
|  0x1b  |    L   | String |
+--------+--------+--------+
[   1    ][   1   ][   L   ]
```

UTFZ is a special encoding made to make encoding and decoding UTF-16 strings more performant and efficient on the browsers.

### Strings

```
string8 stores a utf8 string with a byte length of L
+--------+--------+--------+
|  0x1c  |    L   | String |
+--------+--------+--------+
[   1    ][   1   ][   L   ]

string16 stores a utf8 string with a byte length of L
+--------+--------+--------+
|  0x1d  |    L   | String |
+--------+--------+--------+
[   1    ][   2   ][   L   ]

string32 stores a utf8 string with a byte length of L
+--------+--------+--------+
|  0x1e  |    L   | String |
+--------+--------+--------+
[   1    ][   4   ][   L   ]

string64 stores a utf8 string with a byte length of L
+--------+--------+--------+
|  0x1f  |    L   | String |
+--------+--------+--------+
[   1    ][   8   ][   L   ]

string128 stores a utf8 string with a byte length of L
+--------+--------+--------+
|  0x20  |    L   | String |
+--------+--------+--------+
[   1    ][  16   ][   L   ]

stringn stores a utf8 string which has a N-byte byte length of L
+--------+--------+--------+--------+
|  0x21  |    N   |    L   | String |
+--------+--------+--------+--------+
[   1    ][   1   ][   N   ][   L   ]

Where L is stored in little-endian byte order.
```

### Binary

```
bin8 stores a binary sequence with a byte length of L
+--------+--------+--------+
|  0x22  |    L   |  Data  |
+--------+--------+--------+
[   1    ][   1   ][   L   ]

bin16 stores a binary sequence with a byte length of L
+--------+--------+--------+
|  0x23  |    L   |  Data  |
+--------+--------+--------+
[   1    ][   2   ][   L   ]

bin32 stores a binary sequence with a byte length of L
+--------+--------+--------+
|  0x24  |    L   |  Data  |
+--------+--------+--------+
[   1    ][   4   ][   L   ]

bin64 stores a binary sequence with a byte length of L
+--------+--------+--------+
|  0x25  |    L   |  Data  |
+--------+--------+--------+
[   1    ][   8   ][   L   ]

bin128 stores a binary sequence with a byte length of L
+--------+--------+--------+
|  0x26  |    L   |  Data  |
+--------+--------+--------+
[   1    ][  16   ][   L   ]

binn stores a binary sequence which has a N-byte byte length of L
+--------+--------+--------+--------+
|  0x27  |    N   |    L   |  Data  |
+--------+--------+--------+--------+
[   1    ][   1   ][   N   ][   L   ]

Where L is stored in little-endian byte order.
```

### Boolean

```
true stores a boolean value of true
+--------+
|  0x28  |
+--------+
[   1    ]

false stores a boolean value of false
+--------+
|  0x29  |
+--------+
[   1    ]
```

### Date

```
date stores a 32-bit little-endian uint32 date value
+--------+--------+
|  0x2a  |  Date  |
+--------+--------+
[   1    ][   4   ]

date64 stores a 64-bit little-endian uint64 date value
+--------+--------+
|  0x2b  |  Date  |
+--------+--------+
[   1    ][   8   ]
```

### Constructor

```
constructor8 stores a constructor whose identifier fits in one byte.
+--------+--------+~~~~~~~~~~~+
|  0x2c  |   Id   | Arguments |
+--------+--------+~~~~~~~~~~~+
[   1    ][   1   ][ 1x Array ]

constructor16 stores a constructor whose identifier fits in two bytes.
+--------+--------+~~~~~~~~~~~+
|  0x2d  |   Id   | Arguments |
+--------+--------+~~~~~~~~~~~+
[   1    ][   2   ][ 1x Array ]

constructor32 stores a constructor whose identifier fits in four bytes.
+--------+--------+~~~~~~~~~~~+
|  0x2e  |   Id   | Arguments |
+--------+--------+~~~~~~~~~~~+
[   1    ][   4   ][ 1x Array ]

Where
* Id is a unique positive numeric identifier assigned to the custom class, written in little-endian byte order.
* Arguments is an array of arguments that will get passed to the custom class.
```

### Array

```
array8 stores an array of length L
+--------+--------+~~~~~~~~~+
|  0x2f  |    L   |  Items  |
+--------+--------+~~~~~~~~~+
[   1    ][   1   ][   L    ]

array16 stores an array of length L
+--------+--------+~~~~~~~~~+
|  0x30  |    L   |  Items  |
+--------+--------+~~~~~~~~~+
[   1    ][   2   ][   L    ]

array32 stores an array of length L
+--------+--------+~~~~~~~~~+
|  0x31  |    L   |  Items  |
+--------+--------+~~~~~~~~~+
[   1    ][   4   ][   L    ]

array64 stores an array of length L
+--------+--------+~~~~~~~~~+
|  0x32  |    L   |  Items  |
+--------+--------+~~~~~~~~~+
[   1    ][   8   ][   L    ]

array128 stores an array of length L
+--------+---------+~~~~~~~~~+
|  0x33  |    L    |  Items  |
+--------+---------+~~~~~~~~~+
[   1    ][   16   ][   L    ]

Where L is stored in little-endian byte order.
```

### Object

```
object stores an object with unknown number of keys
+--------+~~~~~~~~~~~~~~~+--------+
|  0x34  |  Key / Value  |  0x35  |
+--------+~~~~~~~~~~~~~~~+--------+
[   1    ][   unknown    ][   1   ]

Where
* odd elements in objects are keys of a map
* the next element of a key is its associated value
```

### Set

```
set stores a set with unknown number of items
+--------+~~~~~~~~~~+--------+
|  0x36  |   Items  |  0x37  |
+--------+~~~~~~~~~~+--------+
[   1    ][ unknown ][   1   ]
```

### Map

```
map stores an map with unknown number of keys
+--------+~~~~~~~~~~~~~~~+--------+
|  0x38  |  Key / Value  |  0x39  |
+--------+~~~~~~~~~~~~~~~+--------+
[   1    ][   unknown    ][   1   ]

Where
* odd elements in objects are keys of a map
* the next element of a key is its associated value
```
