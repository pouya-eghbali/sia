const builtinConstructors = require("./constructors");
const SIA_TYPES = require("./types");

const { toString } = Object.prototype;
const typeOf = (item) => toString.call(item);

class Sia {
  constructor(onBlocksReady, nBlocks = 1, byteSize = 3, size = 33554432) {
    this.strMap = {};
    this.map = new Map();
    this.buffer = Buffer.alloc(size);
    this.refMap = [];
    this.refIndex = 0;
    this.addressSpaceSize = byteSize;
    this.offset = 0;
    this.blocks = 0;
    this.dataBlocks = 0;
    this.onBlocksReady = onBlocksReady;
    this.nBlocks = nBlocks;
    this.bufferedBlocks = 0;
  }
  reset() {
    this.strMap = {};
    this.map = new Map();
    this.refMap = [];
    this.refIndex = 0;
    this.offset = 0;
    this.blocks = 0;
    this.dataBlocks = 0;
    this.bufferedBlocks = 0;
  }
  pushRef(...refs) {
    for (const ref of refs) this.refMap[this.refIndex++] = ref;
  }
  popRef() {
    return this.refMap[--this.refIndex];
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
      const blocks = this.buffer.slice(0, this.offset);
      this.offset = 0;
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
    const cached = this.strMap[string];
    if (!cached) {
      this.writeUInt8(SIA_TYPES.string);
      this.writeUTF8(string);
      const block = this.addBlock(true);
      this.strMap[string] = block;
      return block;
    }
    this.addRef(cached);
    return cached;
  }
  addRef(number) {
    let n = number;
    const bytes = [];
    while (n) {
      var byte = n & 0xff;
      bytes.push(byte);
      n = (n - byte) / 256;
    }
    const { length } = bytes;
    if (length === 1) this.writeUInt8(SIA_TYPES.ref8);
    else if (length === 2) this.writeUInt8(SIA_TYPES.ref16);
    else if (length === 3) this.writeUInt8(SIA_TYPES.ref24);
    else if (length === 4) this.writeUInt8(SIA_TYPES.ref32);
    else if (length === 5) this.writeUInt8(SIA_TYPES.ref40);
    else if (length === 6) this.writeUInt8(SIA_TYPES.ref48);
    else {
      this.writeUInt8(SIA_TYPES.refn);
      this.writeUInt8(length);
    }
    for (const byte of bytes) this.writeUInt8(byte);
    this.addBlock();
  }
  addNumber(number) {
    // TODO: make this faster https://jsben.ch/26igA
    if (Number.isInteger(number)) return this.addInteger(number);
    return this.addFloat(number);
  }
  addInteger(number) {
    if (!this.map.has(number)) {
      let n = number;
      const bytes = [];
      while (n) {
        var byte = n & 0xff;
        bytes.push(byte);
        n = (n - byte) / 256;
      }
      const { length } = bytes;
      if (length === 1) this.writeUInt8(SIA_TYPES.int8);
      else if (length === 2) this.writeUInt8(SIA_TYPES.int16);
      else if (length === 3) this.writeUInt8(SIA_TYPES.int24);
      else if (length === 4) this.writeUInt8(SIA_TYPES.int32);
      else if (length === 5) this.writeUInt8(SIA_TYPES.int40);
      else if (length === 6) this.writeUInt8(SIA_TYPES.int48);
      else {
        this.writeUInt8(SIA_TYPES.intn);
        this.writeUInt8(length);
      }
      for (const byte of bytes) this.writeUInt8(byte);
      const block = this.addBlock(true);
      this.map.set(number, block);
      return block;
    }
    const cached = this.map.get(number);
    this.addRef(cached);
    return cached;
  }
  addFloat(number) {
    if (!this.map.has(number)) {
      this.writeUInt8(SIA_TYPES.float64);
      this.writeDouble(number);
      const block = this.addBlock(true);
      this.map.set(number, block);
      return block;
    }
    const cached = this.map.get(number);
    this.addRef(cached);
    return cached;
  }
  addObject(startRefIndex) {
    this.writeUInt8(SIA_TYPES.object);
    let refs = this.refIndex - startRefIndex;
    this.writeUIntAS(refs / 2);
    while (refs--) this.writeUIntAS(this.popRef());
    const block = this.addBlock(true);
    return block;
  }
  addArray(startRefIndex) {
    this.writeUInt8(SIA_TYPES.arr);
    let refs = this.refIndex - startRefIndex;
    this.writeUIntAS(refs);
    while (refs--) this.writeUIntAS(this.popRef());
    const block = this.addBlock(true);
    return block;
  }
  startArray(length) {
    this.writeUInt8(SIA_TYPES.arr_start);
    this.writeUIntAS(length);
    this.addBlock();
  }
  pushArray(block) {
    this.writeUInt8(SIA_TYPES.arr_push);
    this.writeUIntAS(block);
    this.addBlock();
  }
  endArray() {
    this.writeUInt8(SIA_TYPES.arr_end);
    return this.addBlock(true);
  }
  startObject(/* length */) {
    this.writeUInt8(SIA_TYPES.obj_start);
    this.addBlock();
    //this.writeDouble(length);
  }
  pushObject(block) {
    this.writeUInt8(SIA_TYPES.obj_push);
    this.writeUIntAS(block);
    this.addBlock();
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
  addNull() {
    this.writeUInt8(SIA_TYPES.null);
    const block = this.addBlock(true);
    return block;
  }
  addUndefined() {
    this.writeUInt8(SIA_TYPES.undefined);
    const block = this.addBlock(true);
    return block;
  }
  addCustomType(item) {
    const { args, constructor } = item.toSia();
    const argsRef = this.serializeItem(args);
    const typeRef = this.addString(constructor);
    this.writeUInt8(SIA_TYPES.constructor);
    this.writeUIntAS(typeRef);
    this.writeUIntAS(argsRef);
    return this.addBlock(true);
  }
  serializeItem(item, context = {}) {
    const type = typeOf(item);
    switch (type) {
      case `[object String]`:
        return this.addString(item);

      case `[object Null]`:
        return this.addNull(item);

      case `[object Undefined]`:
        return this.addUndefined(item);

      case `[object Number]`:
        return this.addNumber(item);

      case `[object Boolean]`:
        return this.addBoolean(item);

      case `[object Object]`: {
        if (item.compile) return item.compile(this, context);
        if (item.toSia) return this.addCustomType(item);
        this.startObject();
        for (const key in item) {
          this.addString(key);
          this.serializeItem(item[key]);
        }
        return this.endObject();
      }

      case `[object Array]`: {
        this.startArray();
        for (const m of item) this.serializeItem(m);
        return this.endArray();
      }

      default:
        break;
    }
    const { constructor, args = [] } =
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
    return this.addValue(serializedArgs, max, length);
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
  serialize(data) {
    this.data = data;
    this.reset();
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

class DeSia {
  constructor(constructors, onEnd) {
    this.constructors = constructors;
    this.map = [];
    this.blocks = [];
    this.offset = 0;
    this.onEnd = onEnd;
    this.ended = false;
  }
  reset() {
    this.map = [];
    this.blocks = [];
    this.offset = 0;
    this.ended = false;
  }
  readBlock() {
    const blockType = this.readUInt8();
    switch (blockType) {
      case SIA_TYPES.string: {
        const length = this.readUIntAS();
        const string = this.readUTF8(length);
        this.map.push(string);
        if (this.currentObject) this.currentObject.push(string);
        return string;
      }

      case SIA_TYPES.int8: {
        const number = this.readUInt8();
        this.map.push(number);
        if (this.currentObject) this.currentObject.push(number);
        return number;
      }

      case SIA_TYPES.int16: {
        const number = this.readUInt16();
        this.map.push(number);
        if (this.currentObject) this.currentObject.push(number);
        return number;
      }

      case SIA_TYPES.int24: {
        const number = this.readUInt24();
        this.map.push(number);
        if (this.currentObject) this.currentObject.push(number);
        return number;
      }

      case SIA_TYPES.int32: {
        const number = this.readUInt32();
        this.map.push(number);
        if (this.currentObject) this.currentObject.push(number);
        return number;
      }

      case SIA_TYPES.int40: {
        const number = this.readUInt40();
        this.map.push(number);
        if (this.currentObject) this.currentObject.push(number);
        return number;
      }

      case SIA_TYPES.int48: {
        const number = this.readUInt48();
        this.map.push(number);
        if (this.currentObject) this.currentObject.push(number);
        return number;
      }

      case SIA_TYPES.intn: {
        const n = this.readUInt8();
        const number = this.readUIntN(n);
        this.map.push(number);
        if (this.currentObject) this.currentObject.push(number);
        return number;
      }

      case SIA_TYPES.ref8: {
        const number = this.readUInt8();
        const value = this.map[number];
        if (this.currentObject) this.currentObject.push(value);
        return value;
      }

      case SIA_TYPES.ref16: {
        const number = this.readUInt16();
        const value = this.map[number];
        if (this.currentObject) this.currentObject.push(value);
        return value;
      }

      case SIA_TYPES.ref24: {
        const number = this.readUInt24();
        const value = this.map[number];
        if (this.currentObject) this.currentObject.push(value);
        return value;
      }

      case SIA_TYPES.ref32: {
        const number = this.readUInt32();
        const value = this.map[number];
        if (this.currentObject) this.currentObject.push(value);
        return value;
      }

      case SIA_TYPES.ref40: {
        const number = this.readUInt40();
        const value = this.map[number];
        if (this.currentObject) this.currentObject.push(value);
        return value;
      }

      case SIA_TYPES.ref48: {
        const number = this.readUInt48();
        const value = this.map[number];
        if (this.currentObject) this.currentObject.push(value);
        return value;
      }

      case SIA_TYPES.refn: {
        const n = this.readUInt8();
        const number = this.readUIntN(n);
        const value = this.map[number];
        if (this.currentObject) this.currentObject.push(value);
        return value;
      }

      case SIA_TYPES.float64: {
        const number = this.readDouble();
        this.map.push(number);
        if (this.currentObject) this.currentObject.push(number);
        return number;
      }

      /*   case SIA_TYPES.object: {
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
        this.map.push(object);
        return object;
      } */

      /* case SIA_TYPES.arr: {
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
      } */

      case SIA_TYPES.constructor: {
        const typeRef = this.readUIntAS();
        const argsRef = this.readUIntAS();
        const constructor = this.constructors[this.map[typeRef]];
        const value = constructor(...this.map[argsRef]);
        this.map.push(value);
        return value;
      }

      case SIA_TYPES.false:
        if (this.currentObject) this.currentObject.push(false);
        this.map.push(false);
        return false;

      case SIA_TYPES.true:
        if (this.currentObject) this.currentObject.push(true);
        this.map.push(true);
        return true;

      case SIA_TYPES.null:
        if (this.currentObject) this.currentObject.push(null);
        this.map.push(null);
        return null;

      case SIA_TYPES.undefined:
        if (this.currentObject) this.currentObject.push(undefined);
        this.map.push(undefined);
        return undefined;

      case SIA_TYPES.end:
        this.ended = true;
        break;

      case SIA_TYPES.address:
        this.addressSpaceSize = this.readUInt8();
        return;

      case SIA_TYPES.obj_start: {
        this.currentObject = new CoolObject();
        this.currentObjectLL = new LinkedList(
          this.currentObject,
          this.currentObjectLL
        );
        break;
      }

      case SIA_TYPES.obj_push: {
        const blockRef = this.readUIntAS();
        const value = this.map[blockRef];
        this.currentObject.push(value);
        break;
      }

      case SIA_TYPES.obj_end: {
        const { obj } = this.currentObject;
        this.currentObjectLL = this.currentObjectLL.prev || {};
        this.currentObject = this.currentObjectLL.value;
        this.map.push(obj);
        if (this.currentObject) this.currentObject.push(obj);
        return obj;
      }

      case SIA_TYPES.arr_start: {
        const length = this.readUIntAS();
        this.currentObject = new CoolArray(length);
        this.currentObjectLL = new LinkedList(
          this.currentObject,
          this.currentObjectLL
        );
        break;
      }

      case SIA_TYPES.arr_push: {
        const blockRef = this.readUIntAS();
        const value = this.map[blockRef];
        this.currentObject.push(value);
        break;
      }

      case SIA_TYPES.arr_end: {
        const { arr } = this.currentObject;
        this.currentObjectLL = this.currentObjectLL.prev || {};
        this.currentObject = this.currentObjectLL.value;
        this.map.push(arr);
        if (this.currentObject) this.currentObject.push(arr);
        return arr;
      }

      default:
        const error = `Unsupported type: ${blockType}`;
        throw error;
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
    return this.readNativeUIntN(this.addressSpaceSize);
  }
  readNativeUIntN(n) {
    const intN = this.buffer.readUIntLE(this.offset, n);
    this.offset += n;
    return intN;
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
  readUInt24() {
    return this.readNativeUIntN(3);
  }
  readUInt32() {
    const uInt32 = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return uInt32;
  }
  readUInt40() {
    return this.readNativeUIntN(5);
  }
  readUInt48() {
    return this.readNativeUIntN(6);
  }
  readUIntN(n) {
    let number = 0;
    let i = 0;
    while (i++ < n) number = number * 256 + this.readUInt8();
    return number;
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
  deserialize(buffer) {
    this.buffer = buffer;
    this.reset();
    while (true) {
      const block = this.readBlock();
      if (this.ended) return this.lastBlock;
      this.lastBlock = block;
    }
  }
}

const _Sia = new Sia();
const _Desia = new DeSia(builtinConstructors);

const sia = (data) => _Sia.serialize(data);
const desia = (data) => _Desia.deserialize(data);

module.exports.sia = sia;
module.exports.desia = desia;

module.exports.Sia = Sia;
module.exports.DeSia = DeSia;
/* 
const deepEqual = require("deep-equal");
const fetch = require("node-fetch");

const test = async () => {
  const dataset = [
    42,
    3.14,
    [1, 2, 3],
    [1, 2, 3, "hello"],
    { hello: "meow", meow: "hello" },
    { hello: [1, 2, 3, "hello"] },
    await fetch(
      "https://github.com/json-iterator/test-data/raw/master/large-file.json"
    ).then((resp) => resp.json()),
  ];
  for (const data of dataset) {
    const deserialized = desia(sia(data));
    const result = deepEqual(data, deserialized) ? "PASS" : "FAIL";
    console.log(result, JSON.stringify(data).slice(0, 40));
  }
};

test().catch(console.trace);
 */
