const builtinConstructors = require("./constructors");

const SIA_TYPES = {
  null: 0,
  undefined: 1,
  uint8: 2,
  uint16: 3,
  uint32: 4,
  uint64: 5,
  uint128: 6,
  uintn: 7,
  int8: 8,
  int16: 9,
  int32: 10,
  int64: 11,
  int128: 12,
  intn: 13,
  float8: 14,
  float16: 15,
  float32: 16,
  float64: 17,
  float128: 18,
  floatn: 19,
  uint8_arr: 20,
  uint16_arr: 21,
  uint32_arr: 22,
  uint64_arr: 23,
  uint128_arr: 24,
  uint8_hash: 25,
  uint16_hash: 26,
  uint32_hash: 27,
  uint64_hash: 28,
  uint128_hash: 29,
  uint8_object: 30,
  uint16_object: 31,
  uint32_object: 32,
  uint64_object: 33,
  uint128_object: 34,
  uint8_set: 35,
  uint16_set: 36,
  uint32_set: 37,
  uint64_set: 38,
  uint128_set: 39,
  string: 40,
  raw: 41,
  true: 42,
  false: 43,
  date: 44,
  date64: 45,
  constructor: 46,
  call: 47,
};

class Sia {
  constructor(data) {
    this.data = data;
    this.map = new Map();
    this.buffer = Buffer.alloc(33554432); //32mb TODO
    this.offset = 8;
    this.blocks = 0;
  }
  writeUTF8(part) {
    const length = this.buffer.write(part, this.offset + 8);
    this.buffer.writeDoubleLE(length, this.offset);
    this.offset += length + 8;
  }
  writeUInt8(number) {
    this.buffer.writeUInt8(number, this.offset);
    this.offset += 1;
  }
  writeInt8(number) {
    this.buffer.writeInt8(number, this.offset);
    this.offset += 1;
  }
  writeUInt16(number) {
    this.buffer.writeUInt16LE(number, this.offset);
    this.offset += 2;
  }
  writeInt16(number) {
    this.buffer.writeInt16LE(number, this.offset);
    this.offset += 2;
  }
  writeUInt32(number) {
    this.buffer.writeUInt32LE(number, this.offset);
    this.offset += 4;
  }
  writeInt32(number) {
    this.buffer.writeInt32LE(number, this.offset);
    this.offset += 4;
  }
  writeDouble(number) {
    this.buffer.writeDoubleLE(number, this.offset);
    this.offset += 8;
  }
  addBlock() {
    return this.blocks++;
  }
  addString(string) {
    if (!this.map.has(string)) {
      this.writeUInt8(SIA_TYPES.string);
      this.writeUTF8(string);
      const block = this.addBlock();
      this.map.set(string, block);
      return block;
    }
    return this.map.get(string);
  }
  addNumber(number) {
    //if (Number.isInteger(number)) return this.addInteger(number);
    return this.addFloat(number);
  }
  addInteger(number) {
    if (!this.map.has(number)) {
      this.writeUInt8(SIA_TYPES.float64);
      this.writeDouble(number);
      const block = this.addBlock();
      this.map.set(number, block);
      return block;
    }
    return this.map.get(number);
  }
  addFloat(number) {
    if (!this.map.has(number)) {
      this.writeUInt8(SIA_TYPES.float64);
      this.writeDouble(number);
      const block = this.addBlock();
      this.map.set(number, block);
      return block;
    }
    return this.map.get(number);
  }
  addObject(entries, length) {
    this.writeUInt8(SIA_TYPES.uint64_object);
    this.writeDouble(length);
    for (const item of entries) this.writeDouble(item);
    const block = this.addBlock();
    return block;
  }
  addArray(items, length) {
    this.writeUInt8(SIA_TYPES.uint64_arr);
    this.writeDouble(length);
    for (const item of items) this.writeDouble(item);
    const block = this.addBlock();
    return block;
  }
  addBoolean(bool) {
    const type = bool ? SIA_TYPES.true : SIA_TYPES.false;
    this.writeUInt8(type);
    const block = this.addBlock();
    return block;
  }
  serializeItem(item) {
    const typeOf = typeof item;
    if (typeOf === "string") return this.addString(item);
    if (typeOf === "number") return this.addNumber(item);
    if (typeOf === "boolean") return this.addBoolean(item);
    if (item && item.constructor === Object) {
      let length = 0;
      for (const _ in item) length += 2;
      const entries = new Array(length);
      let i = 0;
      for (const key in item) {
        entries[i++] = this.addString(key);
        entries[i++] = this.serializeItem(item[key]);
      }
      return this.addObject(entries, length / 2);
    }
    if (Array.isArray(item)) {
      const { length } = item;
      const items = new Array(length);
      let i = 0;
      for (const m of item) items[i++] = this.serializeItem(m);
      return this.addArray(items, length);
    }
    /* const { constructor, args = [] } =
      item && item.toSia === "function" ? item.toSia() : this.itemtoSia(item);
    const constructorRef = this.serializeItem(constructor);
    const serializedArgs = [constructorRef];
    let length = 1,
      max = constructorRef;
    for (const arg of args) {
      const argRef = this.serializeItem(arg);
      length++;
      if (argRef > max) max = argRef;
      serializedArgs.push(argRef);
    }
    if (length > max) max = length;
    return this.addValue(serializedArgs, max, length); */
  }
  itemtoSia(item) {
    if (item === null) return Null;
    if (item === undefined) return Undefined;
    const { constructor } = item;
    if (constructor == Date)
      return {
        constructor: "Date",
        args: [item.valueOf()],
      };
    if (constructor === RegExp)
      return {
        constructor: "Regex",
        args: [item.source, item.flags],
      };
    return {
      constructor: constructor.name,
      args: [item.toString()],
    };
  }
  serialize() {
    this.serializeItem(this.data);
    this.buffer.writeDoubleLE(this.blocks - 1);
    return this.buffer.slice(0, this.offset);
  }
}

class DeSia {
  constructor(buffer) {
    this.buffer = buffer;
    this.totalBlocks = this.buffer.readDoubleLE();
    this.map = new Array(this.totalBlocks);
    this.offset = 8;
    this.currentBlock = 0;
  }
  readBlock() {
    const blockType = this.readUInt8();
    if (blockType == SIA_TYPES.string) {
      const length = this.readDouble();
      const string = this.readUTF8(length);
      this.map[this.currentBlock++] = string;
      return string;
    } else if (blockType == SIA_TYPES.float64) {
      const number = this.readDouble();
      this.map[this.currentBlock++] = number;
      return number;
    } else if (blockType == SIA_TYPES.uint64_arr) {
      const length = this.readDouble();
      const arr = new Array(length);
      let i = 0;
      while (i < length) {
        const ref = this.readDouble();
        const value = this.map[ref];
        arr[i++] = value;
      }
      this.map[this.currentBlock++] = arr;
      return arr;
    } else if (blockType == SIA_TYPES.uint64_object) {
      const length = this.readDouble();
      const object = {};
      let i = 0;
      while (i < length) {
        const kRef = this.readDouble();
        const vRef = this.readDouble();
        const key = this.map[kRef];
        const val = this.map[vRef];
        object[key] = val;
        i += 1;
      }
      this.map[this.currentBlock++] = object;
    } else if (blockType == SIA_TYPES.false) {
      this.currentBlock++;
      return false;
    } else if (blockType == SIA_TYPES.true) {
      this.currentBlock++;
      return true;
    }
  }
  getBlockInfo(blockTag) {
    const sign = Math.sign(blockTag) || 1;
    const blockType = Math.floor((sign * blockTag) / 10) * 10;
    const byteSize = blockType
      ? (sign * blockTag) % blockType
      : sign * blockTag;
    return { blockType, byteSize, sign };
  }
  readInt8() {
    const int8 = this.buffer.readInt8(this.offset);
    this.offset++;
    return int8;
  }
  readUInt8() {
    const uInt8 = this.buffer.readUInt8(this.offset);
    this.offset++;
    return uInt8;
  }
  readUInt16() {
    const uInt16 = this.buffer.readUInt16LE(this.offset);
    this.offset += 2;
    return uInt16;
  }
  readUInt32() {
    const uInt32 = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return uInt32;
  }
  readDouble() {
    const uInt64 = this.buffer.readDoubleLE(this.offset);
    this.offset += 8;
    return uInt64;
  }
  readNumber(byteSize) {
    if (byteSize == 1) return this.readUInt8();
    if (byteSize == 2) return this.readUInt16();
    if (byteSize == 4) return this.readUInt32();
    if (byteSize == 8) return this.readDouble();
  }
  readUTF8(length) {
    const utf8 = this.buffer.toString(
      "utf8",
      this.offset,
      this.offset + length
    );
    this.offset += length;
    return utf8;
  }
  deserialize(constructors) {
    this.constructors = constructors;
    let lastBlock;
    while (this.currentBlock < this.totalBlocks) lastBlock = this.readBlock();
    return lastBlock;
  }
}

module.exports.sia = (data) => new Sia(data).serialize();
module.exports.desia = (data, constructors = {}) =>
  new DeSia(data).deserialize({ ...builtinConstructors, ...constructors });
