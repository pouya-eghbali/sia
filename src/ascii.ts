export const asciiToUint8Array = (
  str: string,
  strLength: number,
  buffer: Uint8Array,
  offset: number
) => {
  for (let i = 0; i < strLength; i++) {
    buffer[offset + i] = str.charCodeAt(i);
  }
  return strLength;
};

const fns = new Array(66).fill(0).map((_, i) => {
  const codes = new Array(i)
    .fill(0)
    .map((_, j) => `buf[offset + ${j}]`)
    .join(", ");
  return new Function(
    "buf",
    "length",
    "offset",
    `return String.fromCharCode(${codes});`
  );
});

export const uint8ArrayToAscii = (
  buffer: Uint8Array,
  byteLength: number,
  offset: number
) => {
  return fns[byteLength](buffer, byteLength, offset);
};
