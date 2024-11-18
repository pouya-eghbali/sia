export class Buffer {
  public size: number;
  public content: Uint8Array;
  public offset: number;
  public dataView: DataView;

  constructor(uint8Array: Uint8Array) {
    this.size = uint8Array.length;
    this.content = uint8Array;
    this.offset = 0;
    this.dataView = new DataView(uint8Array.buffer);
  }

  static new(size: number = 32 * 1024 * 1024) {
    return new Buffer(new Uint8Array(size));
  }

  seek(offset: number) {
    this.offset = offset;
  }

  skip(count: number) {
    this.offset += count;
  }

  add(data: Uint8Array) {
    if (this.offset + data.length > this.size) {
      throw new Error("Buffer overflow");
    }
    this.content.set(data, this.offset);
    this.offset += data.length;
  }

  addOne(data: number) {
    if (this.offset + 1 > this.size) {
      throw new Error("Buffer overflow");
    }
    this.content[this.offset] = data;
    this.offset++;
  }

  toUint8Array() {
    return this.content.slice(0, this.offset);
  }

  toUint8ArrayReference() {
    return this.content.subarray(0, this.offset);
  }

  slice(start: number, end: number) {
    return this.content.slice(start, end);
  }

  get(offset: number) {
    return this.content[offset];
  }

  get length() {
    return this.size;
  }
}
