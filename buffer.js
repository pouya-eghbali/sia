const { Buffer: BufferShim } = require("buffer/");

const BufferClass = typeof Buffer === "undefined" ? BufferShim : Buffer;

class GrowingBuffer {
  constructor(size) {
    this.buf = BufferClass.alloc(size);
    return new Proxy(this, {
      set(target, key, value) {
        target.ensureFreeSpace(key + 1);
        target.buf[key] = value;
        return true;
      },
    });
  }
  static alloc(size) {
    return new GrowingBuffer(size);
  }
  ensureFreeSpace(end) {
    while (this.buf.length < end) {
      const buf = Buffer.alloc(this.buf.length * 2);
      this.buf.copy(buf);
      this.buf = buf;
    }
  }
  write(string, offset, length, encoding) {
    this.ensureFreeSpace(offset + string.length * 3);
    return this.buf.write(string, offset, length, encoding);
  }
  writeInt8(value, offset, noAssert) {
    this.ensureFreeSpace(offset + 1);
    return this.buf.writeInt8(value, offset, noAssert);
  }
  writeInt16LE(value, offset, noAssert) {
    this.ensureFreeSpace(offset + 2);
    return this.buf.writeInt16LE(value, offset, noAssert);
  }
  writeInt32LE(value, offset, noAssert) {
    this.ensureFreeSpace(offset + 4);
    return this.buf.writeInt32LE(value, offset, noAssert);
  }
  writeDoubleLE(value, offset, noAssert) {
    this.ensureFreeSpace(offset + 8);
    return this.buf.writeDoubleLE(value, offset, noAssert);
  }
  writeUInt8(value, offset, noAssert) {
    this.ensureFreeSpace(offset + 1);
    return this.buf.writeUInt8(value, offset, noAssert);
  }
  writeUInt16LE(value, offset, noAssert) {
    this.ensureFreeSpace(offset + 2);
    return this.buf.writeUInt16LE(value, offset, noAssert);
  }
  writeUInt32LE(value, offset, noAssert) {
    this.ensureFreeSpace(offset + 4);
    return this.buf.writeUInt32LE(value, offset, noAssert);
  }
  slice(begin, end) {
    return this.buf.slice(begin, end);
  }
  subarray(begin, end) {
    return this.buf.subarray(begin, end);
  }
}

module.exports.Buffer = BufferClass;
module.exports.GrowingBuffer = GrowingBuffer;
