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

| Type name        | Decimal  | Binary    | Hex  |
|------------------|----------|-----------|------|
| null             | 0        |0b00000000 | 0x0  |
| undefined        | 1        |0b00000001 | 0x1  |
| uint8            | 2        |0b00000010 | 0x2  |
| uint16           | 3        |0b00000011 | 0x3  |
| uint32           | 4        |0b00000100 | 0x4  |
| uint64           | 5        |0b00000101 | 0x5  |
| uint128          | 6        |0b00000110 | 0x6  |
| uintn            | 7        |0b00000111 | 0x7  |
| int8             | 8        |0b00001000 | 0x8  |
| int16            | 9        |0b00001001 | 0x9  |
| int32            | 10       |0b00001010 | 0xa  |
| int64            | 11       |0b00001011 | 0xb  |
| int128           | 12       |0b00001100 | 0xc  |
| intn             | 13       |0b00001101 | 0xd  |
| float8           | 14       |0b00001110 | 0xe  |
| float16          | 15       |0b00001111 | 0xf  |
| float32          | 16       |0b00010000 | 0x10 |
| float64          | 17       |0b00010001 | 0x11 |
| float128         | 18       |0b00010010 | 0x12 |
| floatn           | 19       |0b00010011 | 0x13 |
| record           | 20       |0b00010100 | 0x14 |
| ref8             | 21       |0b00010101 | 0x15 |
| ref16            | 22       |0b00010110 | 0x16 |
| ref32            | 23       |0b00010111 | 0x17 |
| ref64            | 24       |0b00011000 | 0x18 |
| ref128           | 25       |0b00011001 | 0x19 |
| refn             | 26       |0b00011010 | 0x1a |
| utfz             | 27       |0b00011011 | 0x1b |
| string8          | 28       |0b00011100 | 0x1c |
| string16         | 29       |0b00011101 | 0x1d |
| string32         | 30       |0b00011110 | 0x1e |
| string64         | 31       |0b00011111 | 0x1f |
| string128        | 32       |0b00100000 | 0x20 |
| stringn          | 33       |0b00100001 | 0x21 |
| bin8             | 34       |0b00100010 | 0x22 |
| bin16            | 35       |0b00100011 | 0x23 |
| bin32            | 36       |0b00100100 | 0x24 |
| bin64            | 37       |0b00100101 | 0x25 |
| bin128           | 38       |0b00100110 | 0x26 |
| binN             | 39       |0b00100111 | 0x27 |
| true             | 40       |0b00101000 | 0x28 |
| false            | 41       |0b00101001 | 0x29 |
| date             | 42       |0b00101010 | 0x2a |
| date64           | 43       |0b00101011 | 0x2b |
| constructor8     | 44       |0b00101100 | 0x2c |
| constructor16    | 45       |0b00101101 | 0x2d |
| constructor32    | 46       |0b00101110 | 0x2e |
| array8           | 52       |0b00110100 | 0x34 |
| array16          | 53       |0b00110101 | 0x35 |
| array32          | 54       |0b00110110 | 0x36 |
| array64          | 55       |0b00110111 | 0x37 |
| array128         | 56       |0b00111000 | 0x38 |
| objectStart      | 57       |0b00111001 | 0x39 |
| objectEnd        | 58       |0b00111010 | 0x3a |
| setStart         | 59       |0b00111011 | 0x3b |
| setEnd           | 60       |0b00111100 | 0x3c |
| mapStart         | 61       |0b00111101 | 0x3d |
| mapEnd           | 62       |0b00111110 | 0x3e |

## Notation in diagrams

```
one byte:
+--------+
|        |
+--------+

a variable number of bytes:
+========+
|        |
+========+

variable number of objects stored in Sia format:
+~~~~~~~~~~~~~~~~~+
|                 |
+~~~~~~~~~~~~~~~~~+
```

`X`, `Y`, `Z`, `K`, `Q`, `A` and `B` are the symbols that will be replaced by an actual bit.

## Block diagrams

### Null

```
null:
+-------+
|  0x0  |
+-------+
```

The `null` block stores `Null` in 1 byte.


### Undefined

```
undefined:
+-------+
|  0x1  |
+-------+
```

The `undefined` block stores `Undefined` in 1 byte.

### Unsigned Integers

```
uint8 stores a 8-bit unsigned integer
+-------+--------+
|  0x2  |ZZZZZZZZ|
+-------+--------+

uint16 stores a 16-bit little-endian unsigned integer
+-------+--------+--------+
|  0x3  |ZZZZZZZZ|ZZZZZZZZ|
+-------+--------+--------+

uint32 stores a 32-bit little-endian unsigned integer
+-------+--------+--------+--------+--------+
|  0x4  |ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|
+-------+--------+--------+--------+--------+

uint64 stores a 64-bit little-endian unsigned integer
+-------+--------+--------+--------+--------+--------+--------+--------+--------+
|  0x5  |ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|
+-------+--------+--------+--------+--------+--------+--------+--------+--------+

uint128 stores a 128-bit little-endian unsigned integer
+-------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+
|  0x6  |ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|
+-------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+

uintn stores a N-byte little-endian unsigned integer
+-------+--------+========+
|  0x7  |AAAAAAAA|  DATA  |
+-------+--------+========+

Where AAAAAAAA is a uint8 value which represents N. 
```

### Signed Integers

```
int8 stores a 8-bit signed integer
+-------+--------+
|  0x8  |ZZZZZZZZ|
+-------+--------+

int16 stores a 16-bit little-endian signed integer
+-------+--------+--------+
|  0x9  |ZZZZZZZZ|ZZZZZZZZ|
+-------+--------+--------+

int32 stores a 32-bit little-endian signed integer
+-------+--------+--------+--------+--------+
|  0xa  |ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|
+-------+--------+--------+--------+--------+

int64 stores a 64-bit little-endian signed integer
+-------+--------+--------+--------+--------+--------+--------+--------+--------+
|  0xb  |ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|
+-------+--------+--------+--------+--------+--------+--------+--------+--------+

int128 stores a 128-bit little-endian signed integer
+-------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+
|  0xc  |ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|
+-------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+

intn stores a N-byte little-endian signed integer
+-------+--------+========+
|  0xd  |AAAAAAAA|  DATA  |
+-------+--------+========+

Where AAAAAAAA is a uint8 value which represents N. 
```

### Floats

```
float8 stores a 8-bit minifloat
+-------+--------+
|  0xe  |ZZZZZZZZ|
+-------+--------+

int16 stores a 16-bit minifloat
+-------+--------+--------+
|  0xf  |ZZZZZZZZ|ZZZZZZZZ|
+-------+--------+--------+

float32 stores a single-precision 32-bit IEEE 754 float
+--------+--------+--------+--------+--------+
|  0x10  |ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|
+--------+--------+--------+--------+--------+

float64 stores a double-precision 64-bit IEEE 754 float
+--------+--------+--------+--------+--------+--------+--------+--------+--------+
|  0x11  |ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|
+--------+--------+--------+--------+--------+--------+--------+--------+--------+

float128 stores a quadruple-precision 128-bit IEEE 754 float
+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+
|  0x12  |ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|
+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+

floatn stores a N-byte floating point number
+--------+--------+========+
|  0x13  |AAAAAAAA|  DATA  |
+--------+--------+========+

Where AAAAAAAA is a uint8 value which represents N. 
```

Check [Minifloat](https://en.wikipedia.org/wiki/Minifloat) article on Wikipedia for more information.

### Record

```
record:
+--------+
|  0x14  |
+--------+
```

The `record` block instructs the deserializer to record the next block and increment the reference count.

### Reference

```
ref8 stores a 8-bit uint8 reference
+--------+--------+
|  0x15  |ZZZZZZZZ|
+--------+--------+

ref16 stores a 16-bit little-endian uint16 reference
+--------+--------+--------+
|  0x16  |ZZZZZZZZ|ZZZZZZZZ|
+--------+--------+--------+

ref32 stores a 32-bit little-endian uint32 reference
+--------+--------+--------+--------+--------+
|  0x17  |ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|
+--------+--------+--------+--------+--------+

ref64 stores a 64-bit little-endian uint64 reference
+--------+--------+--------+--------+--------+--------+--------+--------+--------+
|  0x18  |ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|
+--------+--------+--------+--------+--------+--------+--------+--------+--------+

ref128 stores a 128-bit little-endian uint128 reference
+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+
|  0x19  |ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|
+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+

refn stores a N-byte little-endian reference
+--------+--------+========+
|  0x1a  |AAAAAAAA|  DATA  |
+--------+--------+========+

Where AAAAAAAA is a uint8 value which represents N. 
```

A reference or pointer to a previously recorded block.
Note: Object keys are always recorded.

### UTFZ

```
utfz stores a utfz string with a maximum length of 255
+--------+--------+========+
|  0x1b  |AAAAAAAA|  DATA  |
+--------+--------+========+

Where AAAAAAAA is a uint8 value which represents the byte length of the string.
```

UTFZ is a special encoding made to make encoding and decoding UTF-16 strings more performant and efficient on the browsers.

### Strings

```
string8 stores a utf8 string with a byte length of L
+--------+--------+========+
|  0x1b  |AAAAAAAA|  DATA  |
+--------+--------+========+

string16 stores a utf8 string with a byte length of L
+--------+--------+--------+========+
|  0x1c  |BBBBBBBB|BBBBBBBB|  DATA  |
+--------+--------+--------+========+

string32 stores a utf8 string with a byte length of L
+--------+--------+--------+--------+--------+========+
|  0x1c  |XXXXXXXX|XXXXXXXX|XXXXXXXX|XXXXXXXX|  DATA  |
+--------+--------+--------+--------+--------+========+

string64 stores a utf8 string with a byte length of L
+--------+--------+--------+--------+--------+--------+--------+--------+--------+========+
|  0x1c  |YYYYYYYY|YYYYYYYY|YYYYYYYY|YYYYYYYY|YYYYYYYY|YYYYYYYY|YYYYYYYY|YYYYYYYY|  DATA  |
+--------+--------+--------+--------+--------+--------+--------+--------+--------+========+

string128 stores a utf8 string with a byte length of L
+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+========+
|  0x1c  |ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|ZZZZZZZZ|  DATA  |
+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+--------+========+

stringn stores a utf8 string with a byte length of L
+--------+--------+=========+--------+--------+========+
|  0x1c  |KKKKKKKK|  BYTES  |XXXXXXXX|XXXXXXXX|  DATA  |
+--------+--------+=========+--------+--------+========+

WIP
```
