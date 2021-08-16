const builtinConstructors = require("./constructors");
const SIA_TYPES = require("./types");

const { toString } = Object.prototype;
const typeOf = (item) => toString.call(item);

class Sia {
  constructor({
    onBlocksReady,
    nBlocks = 1,
    hintSize = 2,
    size = 33554432,
    constructors = builtinConstructors,
  } = {}) {
    this.strMap = {};
    this.map = new Map();
    this.buffer = Buffer.alloc(size);
    this.hintSize = hintSize;
    this.offset = 0;
    this.blocks = 0;
    this.dataBlocks = 0;
    this.onBlocksReady = onBlocksReady;
    this.nBlocks = nBlocks;
    this.bufferedBlocks = 0;
    this.constructors = constructors;
  }
  reset() {
    this.strMap = {};
    this.map = new Map();
    this.offset = 0;
    this.blocks = 0;
    this.dataBlocks = 0;
    this.bufferedBlocks = 0;
  }
  writeUTF8(part) {
    const length = this.buffer.write(part, this.offset + this.hintSize);
    this.buffer.writeUIntLE(length, this.offset, this.hintSize);
    this.offset += length + this.hintSize;
  }
  writeUIntHS(number) {
    this.buffer.writeUIntLE(number, this.offset, this.hintSize);
    this.offset += this.hintSize;
  }
  writeUInt8(number) {
    this.buffer.writeUInt8(number, this.offset);
    this.offset += 1;
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
    if (number >> 0 === number) {
      // fits in int32
      this.writeUInt8(SIA_TYPES.ref32);
      this.writeInt32(number);
    } else {
      throw "Ref size is too big";
    }
    this.addBlock();
  }
  addNumber(number) {
    // TODO: make this faster https://jsben.ch/26igA
    if (Number.isInteger(number)) return this.addInteger(number);
    return this.addFloat(number);
  }
  addInteger(number) {
    if (!this.map.has(number)) {
      if (number >> 0 === number) {
        // fits in int32
        this.writeUInt8(SIA_TYPES.int32);
        this.writeInt32(number);
      } else {
        // write a double
        this.writeUInt8(SIA_TYPES.float64);
        this.writeDouble(number);
      }
      //for (const byte of bytes) this.writeUInt8(byte);
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
  startArray(length) {
    this.writeUInt8(SIA_TYPES.arrayStart);
    this.writeUIntHS(length);
    this.addBlock();
  }
  endArray() {
    this.writeUInt8(SIA_TYPES.arrayEnd);
    return this.addBlock(true);
  }
  startObject() {
    this.writeUInt8(SIA_TYPES.objectStart);
    this.addBlock();
  }
  endObject() {
    this.writeUInt8(SIA_TYPES.objectEnd);
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
    const { args, constructor } = this.itemToSia(item);
    const argsRef = this.serializeItem(args);
    const typeRef = this.addString(constructor);
    this.writeUInt8(SIA_TYPES.constructor);
    this.writeUIntHS(typeRef);
    this.writeUIntHS(argsRef);
    return this.addBlock(true);
  }
  serializeItem(item) {
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
        if (item.constructor === Object) {
          this.startObject();
          for (const key in item) {
            this.addString(key);
            this.serializeItem(item[key]);
          }
          return this.endObject();
        } else {
          return this.addCustomType(item);
        }
      }

      case `[object Array]`: {
        this.startArray();
        for (const m of item) this.serializeItem(m);
        return this.endArray();
      }

      default:
        break;
    }
    return this.addCustomType(item);
  }
  itemToSia(item) {
    const { constructor } = item;
    for (const entry of this.constructors) {
      if (entry.constructor === constructor) {
        return {
          constructor: entry.name,
          args: entry.args(item),
        };
      }
    }
  }
  serialize(data) {
    this.data = data;
    this.reset();
    this.writeUInt8(SIA_TYPES.hintSize);
    this.writeUInt8(this.hintSize);
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
  constructor({
    constructors = builtinConstructors,
    onEnd,
    mapSize = 256 * 1000,
  } = {}) {
    this.constructors = constructors;
    this.map = new Array(mapSize);
    this.blocks = 0;
    this.offset = 0;
    this.onEnd = onEnd;
    this.ended = false;
  }
  reset() {
    this.blocks = 0;
    this.offset = 0;
    this.ended = false;
  }
  addBlock(value) {
    this.map[this.blocks++] = value;
  }
  skipBlock() {
    this.blocks++;
  }
  readBlock() {
    const blockType = this.readUInt8();
    switch (blockType) {
      case SIA_TYPES.string: {
        const length = this.readUIntHS();
        const string = this.readUTF8(length);
        this.addBlock(string);
        if (this.currentObject) this.currentObject.push(string);
        return string;
      }

      case SIA_TYPES.int32: {
        const number = this.readInt32();
        this.addBlock(number);
        if (this.currentObject) this.currentObject.push(number);
        return number;
      }

      case SIA_TYPES.ref32: {
        const number = this.readUInt32();
        const value = this.map[number];
        if (this.currentObject) this.currentObject.push(value);
        return value;
      }

      case SIA_TYPES.float64: {
        const number = this.readDouble();
        this.addBlock(number);
        if (this.currentObject) this.currentObject.push(number);
        return number;
      }

      case SIA_TYPES.constructor: {
        const typeRef = this.readUIntHS();
        const argsRef = this.readUIntHS();
        const name = this.map[typeRef];
        const args = this.map[argsRef];
        for (const entry of this.constructors) {
          if (entry.name === name) {
            const value = entry.build(...args);
            this.addBlock(value);
            return value;
          }
        }
      }

      case SIA_TYPES.false:
        if (this.currentObject) this.currentObject.push(false);
        this.skipBlock();
        return false;

      case SIA_TYPES.true:
        if (this.currentObject) this.currentObject.push(true);
        this.skipBlock();
        return true;

      case SIA_TYPES.null:
        if (this.currentObject) this.currentObject.push(null);
        this.skipBlock();
        return null;

      case SIA_TYPES.undefined:
        if (this.currentObject) this.currentObject.push(undefined);
        this.skipBlock();
        return undefined;

      case SIA_TYPES.end:
        this.ended = true;
        break;

      case SIA_TYPES.hintSize:
        this.hintSize = this.readUInt8();
        return;

      case SIA_TYPES.objectStart: {
        this.currentObject = new CoolObject();
        this.currentObjectLL = new LinkedList(
          this.currentObject,
          this.currentObjectLL
        );
        break;
      }

      case SIA_TYPES.objectEnd: {
        const { obj } = this.currentObject;
        this.currentObjectLL = this.currentObjectLL.prev || {};
        this.currentObject = this.currentObjectLL.value;
        this.addBlock(obj);
        if (this.currentObject) this.currentObject.push(obj);
        return obj;
      }

      case SIA_TYPES.arrayStart: {
        const length = this.readUIntHS();
        this.currentObject = new CoolArray(length);
        this.currentObjectLL = new LinkedList(
          this.currentObject,
          this.currentObjectLL
        );
        break;
      }

      case SIA_TYPES.arrayEnd: {
        const { arr } = this.currentObject;
        this.currentObjectLL = this.currentObjectLL.prev || {};
        this.currentObject = this.currentObjectLL.value;
        this.addBlock(arr);
        if (this.currentObject) this.currentObject.push(arr);
        return arr;
      }

      default:
        const error = `Unsupported type: ${blockType}`;
        throw error;
    }
  }
  readUIntHS() {
    return this.readNativeUIntN(this.hintSize);
  }
  readNativeUIntN(n) {
    const intN = this.buffer.readUIntLE(this.offset, n);
    this.offset += n;
    return intN;
  }
  readUInt8() {
    const uInt8 = this.buffer.readUInt8(this.offset);
    this.offset++;
    return uInt8;
  }
  readUInt32() {
    const uInt32 = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return uInt32;
  }
  readInt32() {
    const int32 = this.buffer.readInt32LE(this.offset);
    this.offset += 4;
    return int32;
  }
  readDouble() {
    const uInt64 = this.buffer.readDoubleLE(this.offset);
    this.offset += 8;
    return uInt64;
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
const _Desia = new DeSia();

const sia = (data) => _Sia.serialize(data);
const desia = (data) => _Desia.deserialize(data);

module.exports.sia = sia;
module.exports.desia = desia;

module.exports.Sia = Sia;
module.exports.DeSia = DeSia;
module.exports.constructors = builtinConstructors;
