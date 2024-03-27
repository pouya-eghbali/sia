export class Sia {
  index: number = 0;
  content: Uint8Array = new Uint8Array(0);

  seek(index: number): Sia {
    this.index = index;
    return this;
  }

  setContent(content: Uint8Array): Sia {
    this.content = content;
    return this;
  }

  embedSia(sia: Sia): Sia {
    // Add the content of the given Sia object to the current content
    const newContent = new Uint8Array(this.content.length + sia.content.length);
    newContent.set(this.content);
    newContent.set(sia.content, this.content.length);
    this.content = newContent;
    return this;
  }

  embedBytes(bytes: Uint8Array): Sia {
    // Add the given bytes to the current content
    const newContent = new Uint8Array(this.content.length + bytes.length);
    newContent.set(this.content);
    newContent.set(bytes, this.content.length);
    this.content = newContent;
    return this;
  }

  addUInt8(n: number): Sia {
    // Add a single byte to the content
    const newContent = new Uint8Array(this.content.length + 1);
    newContent.set(this.content);
    newContent[this.content.length] = n;
    this.content = newContent;
    return this;
  }

  readUInt8(): number {
    // Read a single byte from the current index
    if (this.index >= this.content.length) {
      throw new Error("Not enough data to read uint8");
    }
    return this.content[this.index++];
  }

  addInt8(n: number): Sia {
    // Add a single signed byte to the content
    const newContent = new Uint8Array(this.content.length + 1);
    newContent.set(this.content);
    newContent[this.content.length] = n;
    this.content = newContent;
    return this;
  }

  readInt8(): number {
    // Read a single signed byte from the current index
    if (this.index >= this.content.length) {
      throw new Error("Not enough data to read int8");
    }
    return this.content[this.index++];
  }

  addUInt16(n: number): Sia {
    // Add a uint16 value to the content
    const newContent = new Uint8Array(this.content.length + 2);
    newContent.set(this.content);
    const dataView = new DataView(
      newContent.buffer,
      newContent.byteOffset,
      newContent.byteLength
    );
    dataView.setUint16(this.content.length, n, true);
    this.content = newContent;
    return this;
  }

  readUInt16(): number {
    // Read a uint16 value from the current index
    if (this.index + 2 > this.content.length) {
      throw new Error("Not enough data to read uint16");
    }
    const dataView = new DataView(
      this.content.buffer,
      this.content.byteOffset + this.index,
      2
    );
    this.index += 2;
    return dataView.getUint16(0, true);
  }

  addInt16(n: number): Sia {
    // Add an int16 value to the content
    const newContent = new Uint8Array(this.content.length + 2);
    newContent.set(this.content);
    const dataView = new DataView(
      newContent.buffer,
      newContent.byteOffset,
      newContent.byteLength
    );
    dataView.setInt16(this.content.length, n, true);
    this.content = newContent;
    return this;
  }

  readInt16(): number {
    // Read an int16 value from the current index
    if (this.index + 2 > this.content.length) {
      throw new Error("Not enough data to read int16");
    }
    const dataView = new DataView(
      this.content.buffer,
      this.content.byteOffset + this.index,
      2
    );
    this.index += 2;
    return dataView.getInt16(0, true);
  }

  addUInt32(n: number): Sia {
    // Add a uint32 value to the content
    const newContent = new Uint8Array(this.content.length + 4);
    newContent.set(this.content);
    const dataView = new DataView(
      newContent.buffer,
      newContent.byteOffset,
      newContent.byteLength
    );
    dataView.setUint32(this.content.length, n, true);
    this.content = newContent;
    return this;
  }

  readUInt32(): number {
    // Read a uint32 value from the current index
    if (this.index + 4 > this.content.length) {
      throw new Error("Not enough data to read uint32");
    }
    const dataView = new DataView(
      this.content.buffer,
      this.content.byteOffset + this.index,
      4
    );
    this.index += 4;
    return dataView.getUint32(0, true);
  }

  addInt32(n: number): Sia {
    // Add an int32 value to the content
    const newContent = new Uint8Array(this.content.length + 4);
    newContent.set(this.content);
    const dataView = new DataView(
      newContent.buffer,
      newContent.byteOffset,
      newContent.byteLength
    );
    dataView.setInt32(this.content.length, n, true);
    this.content = newContent;
    return this;
  }

  readInt32(): number {
    // Read an int32 value from the current index
    if (this.index + 4 > this.content.length) {
      throw new Error("Not enough data to read int32");
    }
    const dataView = new DataView(
      this.content.buffer,
      this.content.byteOffset + this.index,
      4
    );
    this.index += 4;
    return dataView.getInt32(0, true);
  }

  // Add a uint64 value to the content
  addUInt64(n: number): Sia {
    // Ensure there's enough space to add 8 bytes
    const newContent = new Uint8Array(this.content.length + 8);
    newContent.set(this.content);
    const dataView = new DataView(
      newContent.buffer,
      newContent.byteOffset,
      newContent.byteLength
    );
    // Append the uint64 value at the end of the current content
    dataView.setUint32(this.content.length, n & 0xffffffff, true); // Lower 32 bits
    dataView.setUint32(this.content.length + 4, n / 0x100000000, true); // Upper 32 bits
    this.content = newContent;
    return this;
  }

  // Read a uint64 value from the current index
  readUInt64(): number {
    if (this.index + 8 > this.content.length) {
      throw new Error("Not enough data to read uint64");
    }
    const dataView = new DataView(
      this.content.buffer,
      this.content.byteOffset + this.index,
      8
    );
    // Read the uint64 value
    const lower = dataView.getUint32(0, true);
    const upper = dataView.getUint32(4, true);
    this.index += 8;
    // JavaScript does not support 64-bit integers natively, so this is an approximation
    return upper * 0x100000000 + lower;
  }

  // Add an int64 value to the content
  addInt64(n: number): Sia {
    const newContent = new Uint8Array(this.content.length + 8);
    newContent.set(this.content);
    const dataView = new DataView(
      newContent.buffer,
      newContent.byteOffset,
      newContent.byteLength
    );
    // Append the int64 value at the end of the current content
    dataView.setInt32(this.content.length, n & 0xffffffff, true); // Lower 32 bits as signed
    dataView.setInt32(
      this.content.length + 4,
      Math.floor(n / 0x100000000),
      true
    ); // Upper 32 bits as signed
    this.content = newContent;
    return this;
  }

  // Read an int64 value from the current index
  readInt64(): number {
    if (this.index + 8 > this.content.length) {
      throw new Error("Not enough data to read int64");
    }
    const dataView = new DataView(
      this.content.buffer,
      this.content.byteOffset + this.index,
      8
    );
    // Read the int64 value
    const lower = dataView.getUint32(0, true);
    const upper = dataView.getInt32(4, true); // Treat as signed for the upper part
    this.index += 8;
    // Combine the upper and lower parts
    return upper * 0x100000000 + lower;
  }

  addString8(str: string): Sia {
    const encoder = new TextEncoder();
    const encodedString = encoder.encode(str);
    return this.addByteArray8(encodedString);
  }

  readString8(): string {
    const bytes = this.readByteArray8();
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }

  addString16(str: string): Sia {
    const encoder = new TextEncoder();
    const encodedString = encoder.encode(str);
    return this.addByteArray16(encodedString);
  }

  readString16(): string {
    const bytes = this.readByteArray16();
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }

  addString32(str: string): Sia {
    const encoder = new TextEncoder();
    const encodedString = encoder.encode(str);
    return this.addByteArray32(encodedString);
  }

  readString32(): string {
    const bytes = this.readByteArray32();
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }

  addString64(str: string): Sia {
    const encoder = new TextEncoder();
    const encodedString = encoder.encode(str);
    return this.addByteArray64(encodedString);
  }

  readString64(): string {
    const bytes = this.readByteArray64();
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }

  addByteArrayN(bytes: Uint8Array): Sia {
    const newContent = new Uint8Array(this.content.length + bytes.length);
    newContent.set(this.content);
    newContent.set(bytes, this.content.length);
    this.content = newContent;
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
    if (this.index + length > this.content.length) {
      throw new Error("Not enough data to read byte array");
    }
    const bytes = this.content.slice(this.index, this.index + length);
    this.index += length;
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
    const newContent = new Uint8Array(this.content.length + 1);
    newContent.set(this.content);
    newContent[this.content.length] = boolByte;
    this.content = newContent;
    return this;
  }

  readBool(): boolean {
    const value = this.content[this.index] === 1;
    this.index++;
    return value;
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
