# Sia block structures

Table below shows Sia blocks and structures for Sia draft 4.

In the block structure column, ignore whitespaces, values in `[]` refer to a fixed value (numeric),
values in `()` are name or description, values in `<>` are the size of the specific parts of the block.
So for example `<uint8[0]>` means a `uint8` with value equal to `0` and `<uint32(Ref)>` means a 
reference of size `uint32`. if one or more `<>` are wrapped in a `[]` it means a repetition, for example a
`[n <int8(k)><int8(v)>]` means n times `<int8(k)><int8(v)>`. `asbs` means Address Space Byte Size, for
example, on 24bit mode `asbs` is the same as `uint24` and on 64bit mode it is the same as `uint64`.

Please note these definitions can be changed in future drafts, Sia is a WIP.


| Name             | Byte     | Block structure | Notes |
| ---------------- | -------- | --------------- | ----- |
| `null`           | 0        | `<uint8[0]>`      | |
| `undefined`      | 1        | `<uint8[1]>`      | |
| `uint8`          | 2        | `<uint8[2]><uint8(value)>`   | |
| `uint16`         | 3        | `<uint8[3]><uint16(value)>`  | |
| `uint24`         | 4        | `<uint8[3]><uint24(value)>`  | |
| `uint32`         | 5        | `<uint8[4]><uint32(value)>`  | |
| `uint40`         | 6        | `<uint8[4]><uint40(value)>`  | |
| `uint48`         | 7        | `<uint8[4]><uint48(value)>`  | |
| `uint64`         | 8        | `<uint8[5]><uint64(value)>`  | |
| `uint128`        | 9        | `<uint8[6]><uint128(value)>` | |
| `uintn`          | 10       | `<uint8[7]><uint8(n)><uintn(value)>` | A 2^n-bit integer |
| `int8`           | 11       | `<uint8[8]><int8(value)>`   | |
| `int16`          | 12       | `<uint8[9]><int16(value)>`  | |
| `int24`          | 13       | `<uint8[9]><int24(value)>`  | |
| `int32`          | 14       | `<uint8[10]><int32(value)>`  | |
| `int40`          | 15       | `<uint8[10]><int40(value)>`  | |
| `int48`          | 16       | `<uint8[10]><int48(value)>`  | |
| `int64`          | 17       | `<uint8[11]><int64(value)>`  | |
| `int128`         | 18       | `<uint8[12]><int128(value)>` | |
| `intn`           | 19       | `<uint8[13]><uint8(n)><intn(value)>` | A 2^n-bit integer (unsigned) |
| `float8`         | 20       | `<uint8[14]><float8(value)>`   | |
| `float16`        | 21       | `<uint8[15]><float16(value)>`  | |
| `float24`        | 22       | `<uint8[15]><float24(value)>`  | |
| `float32`        | 23       | `<uint8[16]><float32(value)>`  | |
| `float40`        | 24       | `<uint8[16]><float40(value)>`  | |
| `float48`        | 25       | `<uint8[16]><float48(value)>`  | |
| `float64`        | 26       | `<uint8[17]><float64(value)>`  | |
| `float128`       | 27       | `<uint8[18]><float128(value)>` | |
| `floatn`         | 28       | `<uint8[19]><uint8(n)><floatn(value)>` | A 2^n-bit float |
| `array`          | 29       | `<uint8[20]><bmbl(length)>[length <bmbl(ItemRef)>]` | |
| `hashmap`        | 30       | `<uint8[25]><asbs(length)>[length <asbs(KeyRef)><asbs(ValueRef)>]` | |
| `object`         | 31       | `<uint8[30]><asbs(length)>[length <asbs(KeyRef)><asbs(ValueRef)>]` | |
| `set`            | 32       | `<uint8[35]><asbs(length)>[length <asbs(ItemRef)>]` | |
| `string`         | 33       | `<uint8[40]><asbs(length)>[length <uint8(Char)>]` | Length is byte length, not characters |
| `raw`            | 34       | `<uint8[41]><asbs(length)>[length <uint8(Byte)>]` | |
| `true`           | 35       | `<uint8[42]>` | Some languages don't allow bit read/write so we have to use a byte |
| `false`          | 36       | `<uint8[43]>` | |
| `date`           | 37       | `<uint8[44]><uint32(Epoch)>` | 32 bit unix dates |
| `date64`         | 38       | `<uint8[45]><uint64(Epoch)>` | 64 bit unix dates |
| `constructor`    | 39       | `<uint8[46]><uint64(ConstructorNameRef)><uint64(ArgsArrayRef)>` | Custom constructor |
| `call`           | 40       | `<uint8[47]><uint64(FunctionNameRef)><uint64(ArgsArrayRef)>` | Function call |