const builtinConstructors = require("../constructors");
const SIA_TYPES = require("./types.js");
const test = require("./pl");
const LRU = require("lru-cache");

const { toString } = Object.prototype;
const typeOf = (item) => toString.call(item);

class Sia {
  constructor(data, onBlocksReady, nBlocks = 1, byteSize = 3) {
    this.data = data;
    this.strMap = {};
    this.map = new Map();
    this.buffer = Buffer.alloc(33554432); //32mb TODO
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
    const cached = this.strMap[string];
    if (!cached) {
      this.writeUInt8(SIA_TYPES.string);
      this.writeUTF8(string);
      const block = this.addBlock(true);
      this.strMap[string] = block;
      return block;
    }
    return cached;
  }
  addNumber(number, cache) {
    //if (Number.isInteger(number)) return this.addInteger(number);
    return this.addFloat(number, cache);
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
  addFloat(number, cache) {
    if (!cache || !this.map.has(number)) {
      this.writeUInt8(SIA_TYPES.float64);
      this.writeDouble(number);
      const block = this.addBlock(true);
      this.map.set(number, block);
      return block;
    }
    return this.map.get(number);
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
        if (item.compile) return item.compile(this, {});
        const startRefIndex = this.refIndex;
        for (const key in item) {
          const kRef = this.addString(key);
          const vRef = this.serializeItem(item[key]);
          this.pushRef(kRef, vRef);
        }
        return this.addObject(startRefIndex);
      }

      case `[object Array]`: {
        const startRefIndex = this.refIndex;
        for (const m of item) this.pushRef(this.serializeItem(m));
        return this.addArray(startRefIndex);
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

class Program {
  constructor() {
    this.program = [];
    this.length = 0;
    this.context = { index: 0 };
  }
  push(fn) {
    this.program.push(fn);
    this.length++;
  }
  pop() {
    this.length--;
    return this.program.pop();
  }
  run() {
    const { context } = this;
    while (!context.ended && context.index < this.length) {
      this.program[context.index++](context);
    }
  }
}

class DeSia {
  constructor(buffer, onEnd) {
    this.buffer = buffer;
    this.map = [];
    this.blocks = [];
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
        //this.blocks.push([])
        return string;
      }

      case SIA_TYPES.float64: {
        const number = this.readDouble();
        this.map.push(number);
        return number;
      }

      case SIA_TYPES.object: {
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
      }

      case SIA_TYPES.arr: {
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
        return obj;
      }

      case SIA_TYPES.arr_start: {
        const length = this.readUIntAS();
        this.currentArray = new CoolArray(length);
        this.currentArrayLL = new LinkedList(
          this.currentArray,
          this.currentArrayLL
        );
        break;
      }

      /* case SIA_TYPES.arr_push: {
        const blockRef = this.readUIntAS();
        const value = this.map[blockRef];
        this.currentArray.push(value);
        break;
      } */

      case SIA_TYPES.arr_end: {
        const { arr } = this.currentArray;
        this.currentArrayLL = this.currentArrayLL.prev || {};
        this.currentArray = this.currentArrayLL.value;
        this.map.push(arr);
        return arr;
      }

      case SIA_TYPES.program_start: {
        const program = new Program();
        this.currentProgram = new LinkedList(program, this.currentProgram);
        return program;
      }

      case SIA_TYPES.program_end: {
        const program = this.currentProgram.value;
        this.currentProgram = this.currentProgram.prev;
        if (!this.currentProgram) program.run();
        return program;
      }

      case SIA_TYPES.arr_push: {
        const blockRef = this.readUIntAS();
        const push = () => {
          const value = this.map[blockRef];
          this.currentArray.push(value);
        };
        return this.currentProgram.value.push(push);
      }

      case SIA_TYPES.if: {
        const condRef = this.readUIntAS();
        const If = (context) => {
          if (!this.map[condRef]) context.index++;
        };
        return this.currentProgram.value.push(If);
      }

      case SIA_TYPES.is_bigger: {
        const valRef = this.readUIntAS();
        const lhsRef = this.readUIntAS();
        const rhsRef = this.readUIntAS();
        const isBigger = (context) => {
          this.map[valRef] = this.map[lhsRef] > this.map[rhsRef];
        };
        return this.currentProgram.value.push(isBigger);
      }

      case SIA_TYPES.exit: {
        const exit = (context) => {
          context.ended = true;
        };
        return this.currentProgram.value.push(exit);
      }

      case SIA_TYPES.add_to: {
        const lhsRef = this.readUIntAS();
        const rhsRef = this.readUIntAS();
        const addTo = (context) => {
          this.map[lhsRef] += this.map[rhsRef];
        };
        return this.currentProgram.value.push(addTo);
      }

      case SIA_TYPES.sin: {
        const valRef = this.readUIntAS();
        const argRef = this.readUIntAS();
        const sin = (context) => {
          this.map[valRef] = Math.sin(this.map[argRef]);
        };
        return this.currentProgram.value.push(sin);
      }

      case SIA_TYPES.mul: {
        const valRef = this.readUIntAS();
        const lhsRef = this.readUIntAS();
        const rhsRef = this.readUIntAS();
        const mul = (context) => {
          this.map[valRef] = this.map[lhsRef] * this.map[rhsRef];
        };
        return this.currentProgram.value.push(mul);
      }

      case SIA_TYPES.jump: {
        const lineRef = this.readUIntAS();
        const line = this.map[lineRef];
        const jump = (context) => {
          context.index = line;
        };
        return this.currentProgram.value.push(jump);
      }

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

module.exports.sia = (data, onBlock, nblocks, byteSize) =>
  new Sia(data, onBlock, nblocks, byteSize).serialize();
module.exports.desia = (data, constructors = {}) =>
  new DeSia(data).deserialize({
    ...builtinConstructors,
    ...constructors,
  });

module.exports.Sia = Sia;
module.exports.DeSia = DeSia;

/* const { sia, desia } = module.exports;
console.log(desia(sia(test))); */
/* 
const { sia, desia } = module.exports;
const convertHrtime = require("convert-hrtime");
const prettyBytes = require("pretty-bytes");
const data = require("./large-file.json");

const serstart = process.hrtime();
const serialized = sia(data);
const serend = process.hrtime(serstart);
console.log("Serialize:", convertHrtime(serend).milliseconds);
console.log("Size:", prettyBytes(serialized.length)); */
/* 
const deserstart = process.hrtime();
const result = desia(serialized);
const deserend = process.hrtime(deserstart);
console.log("Deserialize:", convertHrtime(deserend).milliseconds);

 */
/* 
const { sia, desia } = module.exports;
const { asm } = require("../lab/pl");

console.log(desia(sia(asm)));
 */
