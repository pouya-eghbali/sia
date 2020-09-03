const builtinConstructors = require("./constructors");

const SIA_BLOCKS = {
  VALUE: 0,
  NUMBER: 10,
  STRING: 20,
};

const Null = {
  constructor: "Null",
  args: [],
};

const Undefined = {
  constructor: "Undefined",
  args: [],
};

const sdbm = (arr) => arr.reduce((h, v) => v + (h << 6) + (h << 16) - h, 0);

class Sia {
  constructor(data) {
    this.data = data;
    this.map = new Map();
    this.buffer = Buffer.alloc(33554432); //32mb TODO
    this.offset = 0;
    this.blocks = 0;
  }
  nToBytes(n) {
    if (n < 256) return 1;
    if (n < 65536) return 2;
    if (n < 4294967295) return 4;
    return 8;
  }
  writeUTF8(part, length) {
    this.buffer.write(part, this.offset, length);
    this.offset += length;
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
  writeUInt32(number) {
    this.buffer.writeUInt32LE(number, this.offset);
    this.offset += 4;
  }
  writeDouble(number) {
    this.buffer.writeDoubleLE(number, this.offset);
    this.offset += 8;
  }
  writeNumber(byteSize, number) {
    if (byteSize == 1) return this.writeUInt8(number);
    if (byteSize == 2) return this.writeUInt16(number);
    if (byteSize == 4) return this.writeUInt32(number);
    if (byteSize == 8) return this.writeDouble(number);
  }
  addBlock() {
    return this.blocks++;
  }
  addString(string) {
    if (!this.map.has(string)) {
      const { length } = string;
      const byteSize = this.nToBytes(length);
      const blockTag = SIA_BLOCKS.STRING + byteSize;
      this.writeInt8(blockTag);
      this.writeNumber(byteSize, length);
      this.writeUTF8(string, length);
      const block = this.addBlock();
      this.map.set(string, block);
      return block;
    }
    return this.map.get(string);
  }
  addNumber(number) {
    if (!this.map.has(number)) {
      const isInt = Number.isInteger(number);
      const sign = Math.sign(number) || 1;
      const byteSize = isInt ? this.nToBytes(number) : 8;
      const blockTag = (SIA_BLOCKS.NUMBER + byteSize) * sign;
      this.writeInt8(blockTag);
      this.writeNumber(byteSize, sign * number);
      const block = this.addBlock();
      this.map.set(number, block);
      return block;
    }
    return this.map.get(number);
  }
  addValue(args, maxN, argCount) {
    // this hash algo is not reliable, it increases the
    // encode time but decreases the decode time
    // in my opinion it isn't worth it
    //const hash = sdbm(args.slice(1), argCount);
    //if (!this.map.has(hash)) {
    const byteSize = this.nToBytes(maxN);
    const blockTag = SIA_BLOCKS.VALUE + byteSize;
    this.writeInt8(blockTag);
    this.writeNumber(byteSize, argCount);
    for (const arg of args) this.writeNumber(byteSize, arg);
    const block = this.addBlock();
    //  this.map.set(hash, block);
    return block;
    //}
    //return this.map.get(hash);
  }
  serializeItem(item) {
    const typeOf = typeof item;
    if (typeOf === "string") return this.addString(item);
    if (typeOf === "number") return this.addNumber(item);
    if (item && item.constructor === Object) {
      const constructor = this.serializeItem("Object");
      const entries = [constructor];
      let length = 1,
        max = constructor;
      for (const key in item) {
        const keyRef = this.serializeItem(key);
        if (keyRef > max) max = keyRef;
        const valueRef = this.serializeItem(item[key]);
        if (valueRef > max) max = valueRef;
        length += 2;
        entries.push(keyRef, valueRef);
      }
      if (length > max) max = length;
      return this.addValue(entries, max, length);
    }
    if (Array.isArray(item)) {
      const constructor = this.serializeItem("Array");
      const args = [constructor];
      let length = 1,
        max = constructor;
      for (const value of item) {
        const valueRef = this.serializeItem(value);
        args.push(valueRef);
        length++;
        if (valueRef > max) max = valueRef;
      }
      if (length > max) max = length;
      return this.addValue(args, max, length);
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
    return this.buffer.slice(0, this.offset);
  }
}

class DeSia {
  constructor(buffer) {
    this.constructorMap = new Map();
    this.valueMap = new Map();
    this.buffer = buffer;
    this.offset = 0;
    this.length = this.buffer.length;
    this.currentBlock = 0;
  }
  readBlock() {
    const blockTag = this.readInt8(this.offset);
    const { blockType, byteSize, sign } = this.getBlockInfo(blockTag);
    const { STRING, VALUE, NUMBER } = SIA_BLOCKS;
    if (blockType == STRING) {
      const length = this.readNumber(byteSize);
      const string = this.readUTF8(length);
      this.valueMap.set(this.currentBlock, string);
      this.currentBlock++;
      return string;
    } else if (blockType == NUMBER) {
      const unsignedNumber = this.readNumber(byteSize);
      const number = sign * unsignedNumber;
      this.valueMap.set(this.currentBlock, number);
      this.currentBlock++;
      return number;
    } else if (blockType == VALUE) {
      const argCount = this.readNumber(byteSize) - 1;
      const constructorRef = this.readNumber(byteSize);
      const constructorName = this.valueMap.get(constructorRef);
      const constructor = this.constructors[constructorName];
      const args = new Array(argCount);
      for (let i = 0; i < argCount; i++) {
        const argRef = this.readNumber(byteSize);
        const arg = this.valueMap.get(argRef);
        args[i] = arg;
      }
      const value = constructor(...args);
      this.valueMap.set(this.currentBlock, value);
      this.currentBlock++;
      return value;
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
    while (this.offset < this.length - 1) lastBlock = this.readBlock();
    return lastBlock;
  }
}

module.exports.sia = (data) => new Sia(data).serialize();
module.exports.desia = (data, constructors = {}) =>
  new DeSia(data).deserialize({ ...builtinConstructors, ...constructors });
