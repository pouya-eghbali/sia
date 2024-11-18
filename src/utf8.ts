export const utf16ToUtf8Array = (
  str: string,
  strLength: number,
  buffer: Uint8Array,
  offset: number
) => {
  let length = 0;
  for (let i = 0; i < strLength; i++) {
    let charCode = str.charCodeAt(i);
    if (charCode < 0x80) {
      buffer[offset + length++] = charCode;
    } else if (charCode < 0x800) {
      buffer[offset + length++] = 0xc0 | (charCode >> 6);
      buffer[offset + length++] = 0x80 | (charCode & 0x3f);
    } else if (charCode < 0xd800 || charCode > 0xdfff) {
      buffer[offset + length++] = 0xe0 | (charCode >> 12);
      buffer[offset + length++] = 0x80 | ((charCode >> 6) & 0x3f);
      buffer[offset + length++] = 0x80 | (charCode & 0x3f);
    } else {
      // Surrogate pair
      i++;
      const nextCharCode = str.charCodeAt(i);
      if (i >= strLength || (nextCharCode & 0xfc00) !== 0xdc00) {
        throw new Error("Malformed surrogate pair");
      }
      charCode =
        0x10000 + (((charCode & 0x3ff) << 10) | (nextCharCode & 0x3ff));
      buffer[offset + length++] = 0xf0 | (charCode >> 18);
      buffer[offset + length++] = 0x80 | ((charCode >> 12) & 0x3f);
      buffer[offset + length++] = 0x80 | ((charCode >> 6) & 0x3f);
      buffer[offset + length++] = 0x80 | (charCode & 0x3f);
    }
  }
  return length;
};

export const utf8ArrayToUtf16 = (
  buffer: Uint8Array,
  offset: number,
  byteLength: number
): string => {
  let result = "";
  let i = offset;

  while (i < offset + byteLength) {
    const byte1 = buffer[i++];

    if (byte1 < 0x80) {
      // 1-byte sequence (ASCII)
      result += String.fromCharCode(byte1);
    } else if (byte1 < 0xe0) {
      // 2-byte sequence
      const byte2 = buffer[i++];
      if ((byte2 & 0xc0) !== 0x80) {
        throw new Error("Malformed UTF-8 sequence");
      }
      const codePoint = ((byte1 & 0x1f) << 6) | (byte2 & 0x3f);
      result += String.fromCharCode(codePoint);
    } else if (byte1 < 0xf0) {
      // 3-byte sequence
      const byte2 = buffer[i++];
      const byte3 = buffer[i++];
      if ((byte2 & 0xc0) !== 0x80 || (byte3 & 0xc0) !== 0x80) {
        throw new Error("Malformed UTF-8 sequence");
      }
      const codePoint =
        ((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f);
      result += String.fromCharCode(codePoint);
    } else if (byte1 < 0xf8) {
      // 4-byte sequence (surrogate pair needed)
      const byte2 = buffer[i++];
      const byte3 = buffer[i++];
      const byte4 = buffer[i++];
      if (
        (byte2 & 0xc0) !== 0x80 ||
        (byte3 & 0xc0) !== 0x80 ||
        (byte4 & 0xc0) !== 0x80
      ) {
        throw new Error("Malformed UTF-8 sequence");
      }
      const codePoint =
        ((byte1 & 0x07) << 18) |
        ((byte2 & 0x3f) << 12) |
        ((byte3 & 0x3f) << 6) |
        (byte4 & 0x3f);
      const highSurrogate = 0xd800 + ((codePoint - 0x10000) >> 10);
      const lowSurrogate = 0xdc00 + ((codePoint - 0x10000) & 0x3ff);
      result += String.fromCharCode(highSurrogate, lowSurrogate);
    } else {
      throw new Error("Unsupported UTF-8 byte");
    }
  }

  return result;
};
