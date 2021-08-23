const fromCharCode = String.fromCharCode;

const write = (target, position, value, length) => {
  const start = position;
  let i, c1, c2;
  for (i = 0; i < length; i++) {
    c1 = value.charCodeAt(i);
    if (c1 < 0x80) {
      target[position++] = c1;
    } else if (c1 < 0x800) {
      target[position++] = (c1 >> 6) | 0xc0;
      target[position++] = (c1 & 0x3f) | 0x80;
    } else if (
      (c1 & 0xfc00) === 0xd800 &&
      ((c2 = value.charCodeAt(i + 1)) & 0xfc00) === 0xdc00
    ) {
      c1 = 0x10000 + ((c1 & 0x03ff) << 10) + (c2 & 0x03ff);
      i++;
      target[position++] = (c1 >> 18) | 0xf0;
      target[position++] = ((c1 >> 12) & 0x3f) | 0x80;
      target[position++] = ((c1 >> 6) & 0x3f) | 0x80;
      target[position++] = (c1 & 0x3f) | 0x80;
    } else {
      target[position++] = (c1 >> 12) | 0xe0;
      target[position++] = ((c1 >> 6) & 0x3f) | 0x80;
      target[position++] = (c1 & 0x3f) | 0x80;
    }
  }
  return position - start;
};

const readShort = (src, position, length) => {
  if (length < 4) {
    if (length < 2) {
      if (length === 0) return "";
      else {
        let a = src[position++];
        if ((a & 0x80) > 1) {
          position -= 1;
          return;
        }
        return fromCharCode(a);
      }
    } else {
      let a = src[position++];
      let b = src[position++];
      if ((a & 0x80) > 0 || (b & 0x80) > 0) {
        position -= 2;
        return;
      }
      if (length < 3) return fromCharCode(a, b);
      let c = src[position++];
      if ((c & 0x80) > 0) {
        position -= 3;
        return;
      }
      return fromCharCode(a, b, c);
    }
  } else {
    let a = src[position++];
    let b = src[position++];
    let c = src[position++];
    let d = src[position++];
    if ((a & 0x80) > 0 || (b & 0x80) > 0 || (c & 0x80) > 0 || (d & 0x80) > 0) {
      position -= 4;
      return;
    }
    if (length < 6) {
      if (length === 4) return fromCharCode(a, b, c, d);
      else {
        let e = src[position++];
        if ((e & 0x80) > 0) {
          position -= 5;
          return;
        }
        return fromCharCode(a, b, c, d, e);
      }
    } else if (length < 8) {
      let e = src[position++];
      let f = src[position++];
      if ((e & 0x80) > 0 || (f & 0x80) > 0) {
        position -= 6;
        return;
      }
      if (length < 7) return fromCharCode(a, b, c, d, e, f);
      let g = src[position++];
      if ((g & 0x80) > 0) {
        position -= 7;
        return;
      }
      return fromCharCode(a, b, c, d, e, f, g);
    } else {
      let e = src[position++];
      let f = src[position++];
      let g = src[position++];
      let h = src[position++];
      if (
        (e & 0x80) > 0 ||
        (f & 0x80) > 0 ||
        (g & 0x80) > 0 ||
        (h & 0x80) > 0
      ) {
        position -= 8;
        return;
      }
      if (length < 10) {
        if (length === 8) return fromCharCode(a, b, c, d, e, f, g, h);
        else {
          let i = src[position++];
          if ((i & 0x80) > 0) {
            position -= 9;
            return;
          }
          return fromCharCode(a, b, c, d, e, f, g, h, i);
        }
      } else if (length < 12) {
        let i = src[position++];
        let j = src[position++];
        if ((i & 0x80) > 0 || (j & 0x80) > 0) {
          position -= 10;
          return;
        }
        if (length < 11) return fromCharCode(a, b, c, d, e, f, g, h, i, j);
        let k = src[position++];
        if ((k & 0x80) > 0) {
          position -= 11;
          return;
        }
        return fromCharCode(a, b, c, d, e, f, g, h, i, j, k);
      } else {
        let i = src[position++];
        let j = src[position++];
        let k = src[position++];
        let l = src[position++];
        if (
          (i & 0x80) > 0 ||
          (j & 0x80) > 0 ||
          (k & 0x80) > 0 ||
          (l & 0x80) > 0
        ) {
          position -= 12;
          return;
        }
        if (length < 14) {
          if (length === 12)
            return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l);
          else {
            let m = src[position++];
            if ((m & 0x80) > 0) {
              position -= 13;
              return;
            }
            return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m);
          }
        } else {
          let m = src[position++];
          let n = src[position++];
          if ((m & 0x80) > 0 || (n & 0x80) > 0) {
            position -= 14;
            return;
          }
          if (length < 15)
            return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n);
          let o = src[position++];
          if ((o & 0x80) > 0) {
            position -= 15;
            return;
          }
          return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
        }
      }
    }
  }
};

const readLong = (src, position, length) => {
  let result;
  const end = position + length;
  const units = [];
  result = "";
  while (position < end) {
    const byte1 = src[position++];
    if ((byte1 & 0x80) === 0) {
      // 1 byte
      units.push(byte1);
    } else if ((byte1 & 0xe0) === 0xc0) {
      // 2 bytes
      const byte2 = src[position++] & 0x3f;
      units.push(((byte1 & 0x1f) << 6) | byte2);
    } else if ((byte1 & 0xf0) === 0xe0) {
      // 3 bytes
      const byte2 = src[position++] & 0x3f;
      const byte3 = src[position++] & 0x3f;
      units.push(((byte1 & 0x1f) << 12) | (byte2 << 6) | byte3);
    } else if ((byte1 & 0xf8) === 0xf0) {
      // 4 bytes
      const byte2 = src[position++] & 0x3f;
      const byte3 = src[position++] & 0x3f;
      const byte4 = src[position++] & 0x3f;
      let unit =
        ((byte1 & 0x07) << 0x12) | (byte2 << 0x0c) | (byte3 << 0x06) | byte4;
      if (unit > 0xffff) {
        unit -= 0x10000;
        units.push(((unit >>> 10) & 0x3ff) | 0xd800);
        unit = 0xdc00 | (unit & 0x3ff);
      }
      units.push(unit);
    } else {
      units.push(byte1);
    }

    if (units.length >= 0x1000) {
      result += fromCharCode.apply(String, units);
      units.length = 0;
    }
  }

  if (units.length > 0) {
    result += fromCharCode.apply(String, units);
  }

  return result;
};

const read = (src, position, length) => {
  if (length < 16)
    return readShort(src, position, length) || readLong(src, position, length);
  return readLong(src, position, length);
};

module.exports.write = write;
module.exports.read = read;
