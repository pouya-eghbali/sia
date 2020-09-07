const builtinConstructors = require("../constructors");

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
  arr_start: 48,
  arr_end: 49,
  arr_push: 50,
  obj_start: 51,
  obj_end: 52,
  obj_push: 53,
  if: 100,
  end_if: 101,
  is_bigger: 102,
  is_smaller: 103,
  is_equal: 104,
  and: 105,
  or: 106,
  jump: 107,
  exit: 108,
  add_to: 109,
  address: 254,
  end: 255,
};

const { toString } = Object.prototype;
const typeOf = (item) => toString.call(item);

class Sia {
  constructor(data, onBlocksReady, nBlocks = 1) {
    this.data = data;
    this.map = new Map();
    this.buffer = Buffer.alloc(33554432); //32mb TODO
    this.addressSpaceSize = 3;
    this.offset = 0;
    this.blocks = 0;
    this.dataBlocks = 0;
    this.onBlocksReady = onBlocksReady;
    this.nBlocks = nBlocks;
    this.bufferedBlocks = 0;
  }
  writeUTF8(part) {
    const length = this.buffer.write(part, this.offset + this.addressSpaceSize);
    this.buffer.writeUIntLE(length, this.offset, this.addressSpaceSize);
    this.offset += length + this.addressSpaceSize;
  }
  writeUIntAS(number) {
    this.buffer.writeUIntLE(number, this.offset, this.addressSpaceSize);
    this.offset += this.addressSpaceSize;
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
  addBlock(data = false) {
    this.blocks++;
    this.blockReady();
    if (data) return this.dataBlocks++;
  }
  blockReady() {
    if (!this.onBlocksReady) return;
    if (++this.bufferedBlocks >= this.nBlocks) {
      const blocks = this.buffer.slice(this.lastOffset || 0, this.offset);
      this.lastOffset = this.offset;
      this.onBlocksReady(blocks);
      this.bufferedBlocks = 0;
    }
  }
  allBlocksReady() {
    if (!this.onBlocksReady) return;
    const blocks = this.buffer.slice(this.lastOffset || 0, this.offset);
    this.lastOffset = this.offset;
    this.onBlocksReady(blocks);
  }
  addString(string) {
    if (!this.map.has(string)) {
      this.writeUInt8(SIA_TYPES.string);
      this.writeUTF8(string);
      const block = this.addBlock(true);
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
      this.writeUInt32(number);
      const block = this.addBlock(true);
      this.map.set(number, block);
      return block;
    }
    return this.map.get(number);
  }
  addFloat(number) {
    if (!this.map.has(number)) {
      this.writeUInt8(SIA_TYPES.float64);
      this.writeDouble(number);
      const block = this.addBlock(true);
      this.map.set(number, block);
      return block;
    }
    return this.map.get(number);
  }
  addObject(entries, length) {
    this.writeUInt8(SIA_TYPES.uint32_object); // TODO
    this.writeUIntAS(length);
    for (const item of entries) this.writeUIntAS(item);
    const block = this.addBlock(true);
    return block;
  }
  addArray(items, length) {
    this.writeUInt8(SIA_TYPES.uint32_arr); // TODO
    this.writeUIntAS(length);
    for (const item of items) this.writeUIntAS(item);
    const block = this.addBlock(true);
    return block;
  }
  startArray(length) {
    this.writeUInt8(SIA_TYPES.arr_start);
    this.writeUIntAS(length);
  }
  pushArray(block) {
    this.writeUInt8(SIA_TYPES.arr_push);
    this.writeUIntAS(block);
  }
  endArray() {
    this.writeUInt8(SIA_TYPES.arr_end);
    return this.addBlock(true);
  }
  startObject(/* length */) {
    this.writeUInt8(SIA_TYPES.obj_start);
    //this.writeDouble(length);
  }
  pushObject(block) {
    this.writeUInt8(SIA_TYPES.obj_push);
    this.writeUIntAS(block);
  }
  endObject() {
    this.writeUInt8(SIA_TYPES.obj_end);
    return this.addBlock(true);
  }
  addBoolean(bool) {
    const type = bool ? SIA_TYPES.true : SIA_TYPES.false;
    this.writeUInt8(type);
    const block = this.addBlock(true);
    return block;
  }
  serializeItem(item) {
    const type = typeOf(item);
    switch (type) {
      case `[object String]`:
        return this.addString(item);

      case `[object Number]`:
        return this.addNumber(item);

      case `[object Boolean]`:
        return this.addBoolean(item);

      case `[object Object]`: {
        let length = 0;
        for (const _ in item) length += 2;
        const entries = new Array(length);
        let i = 0;
        for (const key in item) {
          entries[i++] = this.addString(key);
          entries[i++] = this.serializeItem(item[key]);
        }
        return this.addObject(entries, length >> 1);
      }

      case `[object Array]`: {
        const { length } = item;
        const items = new Array(length);
        let i = 0;
        for (const m of item) items[i++] = this.serializeItem(m);
        return this.addArray(items, length);
      }

      default:
        break;
    }
    /* if (Array.isArray(item)) {
      const { length } = item;
      const items = new Array(length);
      let i = 0;
      for (const m of item) items[i++] = this.serializeItem(m);
      return this.addArray(items, length);
    } */
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
    const { constructor } = item;
    if (constructor === Date)
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
    this.writeUInt8(SIA_TYPES.address);
    this.writeUInt8(this.addressSpaceSize);
    this.addBlock();
    this.serializeItem(this.data);
    this.writeUInt8(SIA_TYPES.end);
    this.allBlocksReady();
    return this.buffer.slice(0, this.offset);
  }
}

class CoolObject {
  constructor() {
    this.obj = {};
    this.key = null;
  }
  push(item) {
    if (this.key === null) this.key = item;
    else {
      this.obj[this.key] = item;
      this.key = null;
    }
  }
}

class CoolArray {
  constructor(length) {
    this.arr = new Array(length);
    this.index = 0;
  }
  push(item) {
    this.arr[this.index++] = item;
  }
}

class LinkedList {
  constructor(value, prev) {
    this.value = value;
    this.prev = prev;
  }
}

const END = Symbol("end");

class DeSia {
  constructor(buffer, onEnd) {
    this.buffer = buffer;
    this.map = [];
    this.offset = 0;
    this.onEnd = onEnd;
  }
  readBlock() {
    const blockType = this.readUInt8();
    switch (blockType) {
      case SIA_TYPES.string: {
        const length = this.readUIntAS();
        const string = this.readUTF8(length);
        this.map.push(string);
        return string;
      }

      case SIA_TYPES.float64: {
        const number = this.readDouble();
        this.map.push(number);
        return number;
      }

      case SIA_TYPES.uint32_object: {
        // TODO
        const length = this.readUIntAS();
        const object = {};
        let i = 0;
        while (i < length) {
          const kRef = this.readUIntAS();
          const vRef = this.readUIntAS();
          const key = this.map[kRef];
          const val = this.map[vRef];
          object[key] = val;
          i += 1;
        }
        return object;
      }

      case SIA_TYPES.uint32_arr: {
        // TODO
        const length = this.readUIntAS();
        const arr = new Array(length);
        let i = 0;
        while (i < length) {
          const ref = this.readUIntAS();
          const value = this.map[ref];
          arr[i++] = value;
        }
        this.map.push(arr);
        return arr;
      }

      case SIA_TYPES.false:
        return false;

      case SIA_TYPES.true:
        return true;

      case SIA_TYPES.end:
        this.ended = true;
        break;

      case SIA_TYPES.address:
        this.addressSpaceSize = this.readUInt8();
        return;

      default:
        break;
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
  readUIntAS() {
    const intAS = this.buffer.readUIntLE(this.offset, this.addressSpaceSize);
    this.offset += this.addressSpaceSize;
    return intAS;
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
    if (byteSize === 1) return this.readUInt8();
    if (byteSize === 2) return this.readUInt16();
    if (byteSize === 4) return this.readUInt32();
    if (byteSize === 8) return this.readDouble();
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
  deserializeBlocks(buf, nBlocks = 1) {
    this.buffer = buf;
    this.offset = 0;
    while (nBlocks--) {
      const block = this.readBlock();
      if (this.ended) {
        if (this.onEnd) this.onEnd(this.lastBlock);
        return;
      }
      this.lastBlock = block;
    }
  }
  deserialize(constructors) {
    this.constructors = constructors;
    while (true) {
      const block = this.readBlock();
      if (this.ended) return this.lastBlock;
      this.lastBlock = block;
    }
  }
}

module.exports.sia = (data, onBlock) => new Sia(data, onBlock).serialize();
module.exports.desia = (data, constructors = {}) =>
  new DeSia(data).deserialize({
    ...builtinConstructors,
    ...constructors,
  });

module.exports.Sia = Sia;
module.exports.DeSia = DeSia;
/* 
const { sia, desia } = module.exports;
const convertHrtime = require("convert-hrtime");
const prettyBytes = require("pretty-bytes");
const data = require("./large-file.json");

const serstart = process.hrtime();
const serialized = sia(data);
const serend = process.hrtime(serstart);
console.log("Serialize:", convertHrtime(serend).milliseconds);
console.log("Size:", prettyBytes(serialized.length));

const deserstart = process.hrtime();
const result = desia(serialized);
const deserend = process.hrtime(deserstart);
console.log("Deserialize:", convertHrtime(deserend).milliseconds);
 */
