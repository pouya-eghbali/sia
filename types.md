# Sia block structures

The table below shows Sia blocks and structures for Sia draft 3.

In the block structure column, ignore whitespaces, values in `[]` refer to a fixed value (numeric),
values in `()` are name or description, values in `<>` are the size of the specific parts of the block.
So for example `<uint8[0]>` means a `uint8` with value equal to `0` and `<uint32(Ref)>` means a 
reference of size `uint32`. if one or more `<>` are wrapped in a `[]` it means a repetition, for example a
`[n <int8(k)><int8(v)>]` means n times `<int8(k)><int8(v)>`.

Please note these definitions can be changed in future drafts, Sia is a WIP. Even though this specification
defines and recognizes 128 and 2^n-bit numbers, they're not yet usable because of a 2^64-1 max block count.


| Name             | Byte     | Block structure | Notes |
| ---------------- | -------- | --------------- | ----- |
| `null`           | 0        | `<uint8[0]>`      | |
| `undefined`      | 1        | `<uint8[1]>`      | |
| `uint8`          | 2        | `<uint8[2]><uint8(value)>`   | |
| `uint16`         | 3        | `<uint8[3]><uint16(value)>`  | |
| `uint32`         | 4        | `<uint8[4]><uint32(value)>`  | |
| `uint64`         | 5        | `<uint8[5]><uint64(value)>`  | |
| `uint128`        | 6        | `<uint8[6]><uint128(value)>` | |
| `uintn`          | 7        | `<uint8[7]><uint8(n)><uintn(value)>` | A 2^n-bit integer |
| `int8`           | 8        | `<uint8[8]><int8(value)>`   | |
| `int16`          | 9        | `<uint8[9]><int16(value)>`  | |
| `int32`          | 10       | `<uint8[10]><int32(value)>`  | |
| `int64`          | 11       | `<uint8[11]><int64(value)>`  | |
| `int128`         | 12       | `<uint8[12]><int128(value)>` | |
| `intn`           | 13       | `<uint8[13]><uint8(n)><intn(value)>` | A 2^n-bit integer (unsigned) |
| `float8`         | 14       | `<uint8[14]><float8(value)>`   | |
| `float16`        | 15       | `<uint8[15]><float16(value)>`  | |
| `float32`        | 16       | `<uint8[16]><float32(value)>`  | |
| `float64`        | 17       | `<uint8[17]><float64(value)>`  | |
| `float128`       | 18       | `<uint8[18]><float128(value)>` | |
| `floatn`         | 19       | `<uint8[19]><uint8(n)><floatn(value)>` | A 2^n-bit float |
| `uint8_array`    | 20       | `<uint8[20]><uint64(length)>[length <uint8(ItemRef)>]` | |
| `uint16_array`   | 21       | `<uint8[21]><uint64(length)>[length <uint16(ItemRef)>]` | |
| `uint32_array`   | 22       | `<uint8[22]><uint64(length)>[length <uint32(ItemRef)>]` | |
| `uint64_array`   | 23       | `<uint8[23]><uint64(length)>[length <uint64(ItemRef)>]` | |
| `uint128_array`  | 24       | `<uint8[24]><uint64(length)>[length <uint128(ItemRef)>]` | |
| `uint8_hash`     | 25       | `<uint8[25]><uint64(length)>[length <uint8(KeyRef)><uint8(ValueRef)>]` | |
| `uint16_hash`    | 26       | `<uint8[26]><uint64(length)>[length <uint16(KeyRef)><uint16(ValueRef)>]` | |
| `uint32_hash`    | 27       | `<uint8[27]><uint64(length)>[length <uint32(KeyRef)><uint32(ValueRef)>]` | |
| `uint64_hash`    | 28       | `<uint8[28]><uint64(length)>[length <uint64(KeyRef)><uint64(ValueRef)>]` | |
| `uint128_hash`   | 29       | `<uint8[29]><uint64(length)>[length <uint128(KeyRef)><uint128(ValueRef)>]` | |
| `uint8_object`   | 30       | `<uint8[30]><uint64(length)>[length <uint8(KeyRef)><uint8(ValueRef)>]` | |
| `uint16_object`  | 31       | `<uint8[31]><uint64(length)>[length <uint16(KeyRef)><uint16(ValueRef)>]` | |
| `uint32_object`  | 32       | `<uint8[32]><uint64(length)>[length <uint32(KeyRef)><uint32(ValueRef)>]` | |
| `uint64_object`  | 33       | `<uint8[33]><uint64(length)>[length <uint64(KeyRef)><uint64(ValueRef)>]` | |
| `uint128_object` | 34       | `<uint8[34]><uint64(length)>[length <uint128(KeyRef)><uint128(ValueRef)>]` | |
| `uint8_set`      | 35       | `<uint8[35]><uint64(length)>[length <uint8(ItemRef)>]` | |
| `uint16_set`     | 36       | `<uint8[36]><uint64(length)>[length <uint16(ItemRef)>]` | |
| `uint32_set`     | 37       | `<uint8[37]><uint64(length)>[length <uint32(ItemRef)>]` | |
| `uint64_set`     | 38       | `<uint8[38]><uint64(length)>[length <uint64(ItemRef)>]` | |
| `uint128_set`    | 39       | `<uint8[39]><uint64(length)>[length <uint128(ItemRef)>]` | |
| `string`         | 40       | `<uint8[40]><uint64(length)>[length <uint8(Char)>]` | Length is byte length, not characters |
| `raw`            | 41       | `<uint8[41]><uint64(length)>[length <uint8(Byte)>]` | |
| `true`           | 42       | `<uint8[42]>` | Some languages don't allow bit read/write so we have to use a byte |
| `false`          | 43       | `<uint8[43]>` | |
| `date`           | 44       | `<uint8[44]><uint32(Epoch)>` | 32 bit unix dates |
| `date64`         | 45       | `<uint8[45]><uint64(Epoch)>` | 64 bit unix dates |
| `constructor`    | 46       | `<uint8[46]><uint64(ConstructorNameRef)><uint64(ArgsArrayRef)>` | Custom constructor |
| `call`           | 47       | `<uint8[47]><uint64(FunctionNameRef)><uint64(ArgsArrayRef)>` | Function call |