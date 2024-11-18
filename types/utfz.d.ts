declare module "utfz-lib" {
  export function pack(
    value: string,
    length: number,
    buffer: Uint8Array,
    offset: number
  ): number;
}
