declare module "utfz-lib" {
  export function pack(
    value: string,
    length: number,
    buffer: Uint8Array,
    offset: number
  ): number;

  export function unpack(
    buffer: Uint8Array,
    byteLength: number,
    offset: number
  ): string;
}
