import { Buffer } from "./buffer.js";
import { utf16ToUtf8Array } from "./utf8.js";

const GLOBAL_SHARED_UNSAFE_BUFFER = new Uint8Array(32 * 1024 * 1024);

export class Sia extends Buffer {
  encoder: TextEncoder = new TextEncoder();
  decoder: TextDecoder = new TextDecoder();

  constructor(content?: Uint8Array) {
    super(content || GLOBAL_SHARED_UNSAFE_BUFFER);
  }

  seek(index: number): Sia {
    super.seek(index);
    return this;
  }

  skip(bytes: number): Sia {
    super.skip(bytes);
    return this;
  }

  setContent(content: Uint8Array): Sia {
    this.content = content;
    this.offset = 0;
    return this;
  }

  embedSia(sia: Sia): Sia {
    // Add the content of the given Sia object to the current content
    this.add(sia.toUint8Array());
    return this;
  }

  embedBytes(bytes: Uint8Array): Sia {
    // Add the given bytes to the current content
    this.add(bytes);
    return this;
  }

  addUInt8(n: number): Sia {
    // Add a single byte to the content
    this.addOne(n);
    return this;
  }

  readUInt8(): number {
    // Read a single byte from the current index
    if (this.offset >= this.length) {
      throw new Error("Not enough data to read uint8");
    }
    return this.get(this.offset++);
  }

  addInt8(n: number): Sia {
    // Add a single signed byte to the content
    this.addOne(n);
    return this;
  }

  // TODO: Fix signed integer reading
  readInt8(): number {
    // Read a single signed byte from the current index
    if (this.offset >= this.length) {
      throw new Error("Not enough data to read int8");
    }
    return this.get(this.offset++);
  }

  addUInt16(n: number): Sia {
    // Add a uint16 value to the content
    this.dataView.setUint16(this.offset, n, true);
    return this;
  }

  readUInt16(): number {
    // Read a uint16 value from the current index
    if (this.offset + 2 > this.content.length) {
      throw new Error("Not enough data to read uint16");
    }
    const value = this.dataView.getUint16(this.offset, true);
    this.offset += 2;
    return value;
  }

  addInt16(n: number): Sia {
    // Add an int16 value to the content
    this.dataView.setInt16(this.offset, n, true);
    return this;
  }

  readInt16(): number {
    // Read an int16 value from the current index
    if (this.offset + 2 > this.content.length) {
      throw new Error("Not enough data to read int16");
    }
    const value = this.dataView.getInt16(this.offset, true);
    this.offset += 2;
    return value;
  }

  addUInt32(n: number): Sia {
    // Add a uint32 value to the content
    this.dataView.setUint32(this.offset, n, true);
    this.offset += 4;
    return this;
  }

  readUInt32(): number {
    // Read a uint32 value from the current index
    if (this.offset + 4 > this.content.length) {
      throw new Error("Not enough data to read uint32");
    }
    const value = this.dataView.getUint32(this.offset, true);
    this.offset += 4;
    return value;
  }

  addInt32(n: number): Sia {
    // Add an int32 value to the content
    this.dataView.setInt32(this.offset, n, true);
    this.offset += 4;
    return this;
  }

  readInt32(): number {
    // Read an int32 value from the current index
    if (this.offset + 4 > this.content.length) {
      throw new Error("Not enough data to read int32");
    }
    const value = this.dataView.getInt32(this.offset, true);
    this.offset += 4;
    return value;
  }

  // Add a uint64 value to the content
  addUInt64(n: number): Sia {
    // Append the uint64 value at the end of the current content
    this.dataView.setUint32(this.offset, n & 0xffffffff, true); // Lower 32 bits
    this.dataView.setUint32(this.offset + 4, n / 0x100000000, true); // Upper 32 bits
    this.offset += 8;
    return this;
  }

  // Read a uint64 value from the current index
  readUInt64(): number {
    if (this.offset + 8 > this.content.length) {
      throw new Error("Not enough data to read uint64");
    }
    // Read the uint64 value
    const lower = this.dataView.getUint32(this.offset, true);
    const upper = this.dataView.getUint32(this.offset + 4, true);
    this.offset += 8;
    // JavaScript does not support 64-bit integers natively, so this is an approximation
    return upper * 0x100000000 + lower;
  }

  // Add an int64 value to the content
  addInt64(n: number): Sia {
    // Append the int64 value at the end of the current content
    this.dataView.setInt32(this.offset, n & 0xffffffff, true); // Lower 32 bits
    this.dataView.setInt32(this.offset + 4, n / 0x100000000, true); // Upper 32 bits
    this.offset += 8;
    return this;
  }

  // Read an int64 value from the current index
  readInt64(): number {
    if (this.offset + 8 > this.content.length) {
      throw new Error("Not enough data to read int64");
    }
    // Read the int64 value
    const lower = this.dataView.getInt32(this.offset, true);
    const upper = this.dataView.getInt32(this.offset + 4, true); // Treat as signed for the upper part
    this.offset += 8;
    // Combine the upper and lower parts
    return upper * 0x100000000 + lower;
  }

  addString8(str: string): Sia {
    const length = str.length;
    if (length < 65) {
      const lengthOffset = this.offset++;
      this.offset += utf16ToUtf8Array(str, length, this.content, this.offset);
      this.content[lengthOffset] = this.offset - lengthOffset - 1;
      return this;
    } else {
      const encodedString = this.encoder.encode(str);
      return this.addByteArray8(encodedString);
    }
  }

  readString8(): string {
    const bytes = this.readByteArray8();
    return this.decoder.decode(bytes);
  }

  addString16(str: string): Sia {
    const encodedString = this.encoder.encode(str);
    return this.addByteArray16(encodedString);
  }

  readString16(): string {
    const bytes = this.readByteArray16();
    return this.decoder.decode(bytes);
  }

  addString32(str: string): Sia {
    const encodedString = this.encoder.encode(str);
    return this.addByteArray32(encodedString);
  }

  readString32(): string {
    const bytes = this.readByteArray32();
    return this.decoder.decode(bytes);
  }

  addString64(str: string): Sia {
    const encodedString = this.encoder.encode(str);
    return this.addByteArray64(encodedString);
  }

  readString64(): string {
    const bytes = this.readByteArray64();
    return this.decoder.decode(bytes);
  }

  addByteArrayN(bytes: Uint8Array): Sia {
    this.add(bytes);
    return this;
  }

  addByteArray8(bytes: Uint8Array): Sia {
    return this.addUInt8(bytes.length).addByteArrayN(bytes);
  }

  addByteArray16(bytes: Uint8Array): Sia {
    return this.addUInt16(bytes.length).addByteArrayN(bytes);
  }

  addByteArray32(bytes: Uint8Array): Sia {
    return this.addUInt32(bytes.length).addByteArrayN(bytes);
  }

  addByteArray64(bytes: Uint8Array): Sia {
    return this.addUInt64(bytes.length).addByteArrayN(bytes);
  }

  readByteArrayN(length: number): Uint8Array {
    if (this.offset + length > this.content.length) {
      throw new Error("Not enough data to read byte array");
    }
    const bytes = this.content.slice(this.offset, this.offset + length);
    this.offset += length;
    return bytes;
  }

  readByteArray8(): Uint8Array {
    const length = this.readUInt8();
    return this.readByteArrayN(length);
  }

  readByteArray16(): Uint8Array {
    const length = this.readUInt16();
    return this.readByteArrayN(length);
  }

  readByteArray32(): Uint8Array {
    const length = this.readUInt32();
    return this.readByteArrayN(length);
  }

  readByteArray64(): Uint8Array {
    const length = this.readUInt64();
    return this.readByteArrayN(length);
  }

  addBool(b: boolean): Sia {
    const boolByte = b ? 1 : 0;
    this.addOne(boolByte);
    return this;
  }

  readBool(): boolean {
    return this.readUInt8() === 1;
  }

  addBigInt(n: bigint): Sia {
    // Convert BigInt to a byte array in a way that matches Go's encoding
    let hex = n.toString(16);
    // Ensure even length
    if (hex.length % 2 === 1) {
      hex = "0" + hex;
    }

    const length = hex.length / 2;
    const bytes = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }

    // Add length as a single byte (assuming the byte array is not longer than 255 for simplicity)
    if (length > 255) {
      throw new Error("BigInt too large for this simple implementation");
    }

    return this.addByteArray8(bytes); // Reuse addByteArray to handle appending
  }

  readBigInt(): bigint {
    const bytes = this.readByteArray8(); // Reuse readByteArray to handle reading
    let hex = "";

    bytes.forEach((byte) => {
      hex += byte.toString(16).padStart(2, "0");
    });

    return BigInt("0x" + hex);
  }

  private readArray<T>(length: number, fn: (s: Sia) => T): T[] {
    const arr = [];
    for (let i = 0; i < length; i++) {
      arr.push(fn(this));
    }
    return arr;
  }

  addArray8<T>(arr: T[], fn: (s: Sia, item: T) => void): Sia {
    this.addUInt8(arr.length);
    arr.forEach((item) => fn(this, item));
    return this;
  }

  readArray8<T>(fn: (s: Sia) => T): T[] {
    const length = this.readUInt8();
    return this.readArray(length, fn);
  }

  addArray16<T>(arr: T[], fn: (s: Sia, item: T) => void): Sia {
    this.addUInt16(arr.length);
    arr.forEach((item) => fn(this, item));
    return this;
  }

  readArray16<T>(fn: (s: Sia) => T): T[] {
    const length = this.readUInt16();
    return this.readArray(length, fn);
  }

  addArray32<T>(arr: T[], fn: (s: Sia, item: T) => void): Sia {
    this.addUInt32(arr.length);
    arr.forEach((item) => fn(this, item));
    return this;
  }

  readArray32<T>(fn: (s: Sia) => T): T[] {
    const length = this.readUInt32();
    return this.readArray(length, fn);
  }

  addArray64<T>(arr: T[], fn: (s: Sia, item: T) => void): Sia {
    this.addUInt64(arr.length);
    arr.forEach((item) => fn(this, item));
    return this;
  }

  readArray64<T>(fn: (s: Sia) => T): T[] {
    const length = this.readUInt64();
    return this.readArray(length, fn);
  }
}
