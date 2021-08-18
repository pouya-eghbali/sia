const builtinConstructors = require("./constructors");
const SIA_TYPES = require("./types");
const utf8 = require("utf8-buffer");

const { toString } = Object.prototype;
const typeOf = (item) => toString.call(item);

class Sia {
  constructor({
    onBlocksReady,
    nBlocks = 1,
    size = 33554432,
    constructors = builtinConstructors,
  } = {}) {
    this.strMap = {};
    this.map = new Map();
    this.buffer = Buffer.alloc(size);
    this.offset = 0;
    this.blocks = 0;
    this.dataBlocks = 0;
    this.onBlocksReady = onBlocksReady;
    this.nBlocks = nBlocks;
    this.bufferedBlocks = 0;
    this.constructors = constructors;
  }
  reset() {
    this.refCount = 0;
    this.strMap = {};
    this.map = new Map();
    this.offset = 0;
    this.blocks = 0;
    this.dataBlocks = 0;
    this.bufferedBlocks = 0;
  }
  writeUTF8Short(str, offset) {
    return str.length > 80
      ? this.buffer.write(str, offset)
      : utf8.pack(str, this.buffer, offset) - offset;
  }
  writeUTF8(str, offset) {
    return this.buffer.write(str, offset);
  }
  writeUInt8(number) {
    this.buffer.writeUInt8(number, this.offset);
    this.offset += 1;
  }
  writeUInt16(number) {
    this.buffer.writeUInt16LE(number, this.offset);
    this.offset += 2;
  }
  writeUInt32(number) {
    this.buffer.writeUInt32LE(number, this.offset);
    this.offset += 4;
  }
  writeInt16(number) {
    this.buffer.writeInt16LE(number, this.offset);
    this.offset += 2;
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
    const cached = this.map.get(string);
    if (!cached) {
      const byteLength = string.length * 3;
      if (byteLength < 0x100) {
        this.writeUInt8(SIA_TYPES.string8);
        const length = this.writeUTF8Short(string, this.offset + 1);
        this.buffer.writeUInt8(length, this.offset);
        this.offset += length + 1;
      } else if (byteLength < 0x10000) {
        this.writeUInt8(SIA_TYPES.string16);
        const length = this.writeUTF8(string, this.offset + 2);
        this.buffer.writeUInt16LE(length, this.offset);
        this.offset += length + 2;
      } else {
        this.writeUInt8(SIA_TYPES.string32);
        const length = this.writeUTF8(string, this.offset + 4);
        this.buffer.writeUInt16LE(length, this.offset);
        this.offset += length + 4;
      }
      const block = this.addBlock(true);
      this.map.set(string, block);
      return block;
    }
    this.addRef(cached);
    return cached;
  }
  addRef(number) {
    this.refCount++;
    if (number < 0x100) {
      // fits in int32
      this.writeUInt8(SIA_TYPES.ref8);
      this.writeUInt8(number);
    } else if (number < 0x10000) {
      this.writeUInt8(SIA_TYPES.ref16);
      this.writeUInt16(number);
    } else if (number < 0x10000000) {
      this.writeUInt8(SIA_TYPES.ref32);
      this.writeUInt32(number);
    } else {
      throw `Ref size ${number} is too big`;
    }
    this.addBlock();
  }
  addNumber(number) {
    // TODO: make this faster https://jsben.ch/26igA
    if (Number.isInteger(number)) return this.addInteger(number);
    return this.addFloat(number);
  }
  addInteger(number) {
    const cached = this.map.get(number);
    if (!cached) {
      if (number < 0x100) {
        this.writeUInt8(SIA_TYPES.int8);
        this.writeUInt8(number);
      } else if (number >> 0 === number) {
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
    this.addRef(cached);
    return cached;
  }
  addFloat(number) {
    const cached = this.map.get(number);
    if (!cached) {
      this.writeUInt8(SIA_TYPES.float64);
      this.writeDouble(number);
      const block = this.addBlock(true);
      this.map.set(number, block);
      return block;
    }
    this.addRef(cached);
    return cached;
  }
  startArray(length) {
    if (length < 0x100) {
      this.writeUInt8(SIA_TYPES.arrayStart8);
      this.writeUInt8(length);
    } else if (length < 0x10000) {
      this.writeUInt8(SIA_TYPES.arrayStart16);
      this.writeUInt16(length);
    }
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
          for (const key of Object.keys(item)) {
            this.addString(key);
            this.serializeItem(item[key]);
          }
          return this.endObject();
        } else {
          return this.addCustomType(item);
        }
      }

      case `[object Array]`: {
        this.startArray(item.length);
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
  constructor(curr) {
    this.curr = curr;
  }
  link(next) {
    next.prev = this.curr;
    this.curr = next;
  }
  unlink() {
    const { curr } = this;
    this.curr = curr.prev;
    return curr;
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
    this.objects = new LinkedList();
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
      case SIA_TYPES.string8: {
        const length = this.readUInt8();
        const string = this.readUTF8Short(length);
        this.addBlock(string);
        if (this.objects.curr) this.objects.curr.push(string);
        return string;
      }

      case SIA_TYPES.string16: {
        const length = this.readUInt16();
        const string = this.readUTF8(length);
        this.addBlock(string);
        if (this.objects.curr) this.objects.curr.push(string);
        return string;
      }

      case SIA_TYPES.string32: {
        const length = this.readUInt32();
        const string = this.readUTF8(length);
        this.addBlock(string);
        if (this.objects.curr) this.objects.curr.push(string);
        return string;
      }

      case SIA_TYPES.int8: {
        const number = this.readUInt8();
        this.addBlock(number);
        if (this.objects.curr) this.objects.curr.push(number);
        return number;
      }

      case SIA_TYPES.int32: {
        const number = this.readInt32();
        this.addBlock(number);
        if (this.objects.curr) this.objects.curr.push(number);
        return number;
      }

      case SIA_TYPES.ref8: {
        const number = this.readUInt8();
        const value = this.map[number];
        if (this.objects.curr) this.objects.curr.push(value);
        return value;
      }

      case SIA_TYPES.ref16: {
        const number = this.readUInt16();
        const value = this.map[number];
        if (this.objects.curr) this.objects.curr.push(value);
        return value;
      }

      case SIA_TYPES.ref32: {
        const number = this.readUInt32();
        const value = this.map[number];
        if (this.objects.curr) this.objects.curr.push(value);
        return value;
      }

      case SIA_TYPES.float64: {
        const number = this.readDouble();
        this.addBlock(number);
        if (this.objects.curr) this.objects.curr.push(number);
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
        if (this.objects.curr) this.objects.curr.push(false);
        this.skipBlock();
        return false;

      case SIA_TYPES.true:
        if (this.objects.curr) this.objects.curr.push(true);
        this.skipBlock();
        return true;

      case SIA_TYPES.null:
        if (this.objects.curr) this.objects.curr.push(null);
        this.skipBlock();
        return null;

      case SIA_TYPES.undefined:
        if (this.objects.curr) this.objects.curr.push(undefined);
        this.skipBlock();
        return undefined;

      case SIA_TYPES.end:
        this.ended = true;
        break;

      case SIA_TYPES.objectStart: {
        this.objects.link(new CoolObject());
        break;
      }

      case SIA_TYPES.objectEnd: {
        const { obj } = this.objects.unlink();
        this.addBlock(obj);
        if (this.objects.curr) this.objects.curr.push(obj);
        return obj;
      }

      case SIA_TYPES.arrayStart8: {
        const length = this.readUInt8();
        this.objects.link(new CoolArray(length));
        break;
      }

      case SIA_TYPES.arrayStart16: {
        const length = this.readUInt16();
        this.objects.link(new CoolArray(length));
        break;
      }

      case SIA_TYPES.arrayEnd: {
        const { arr } = this.objects.unlink();
        this.addBlock(arr);
        if (this.objects.curr) this.objects.curr.push(arr);
        return arr;
      }

      default:
        const error = `Unsupported type: ${blockType}`;
        throw error;
    }
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
  readUTF8Short(length) {
    const str = this.buffer.toString("utf8", this.offset, this.offset + length);

    this.offset += length;
    return str;
  }
  readUTF8(length) {
    const str = this.buffer.toString("utf8", this.offset, this.offset + length);
    this.offset += length;
    return str;
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
