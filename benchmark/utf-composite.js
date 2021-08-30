const { makefn } = require("../lab/generator");

const pack = (str, length, buf, offset) => {
  const start = offset;
  let currHigh = 0;
  for (let i = 0; i < length; i++) {
    const code = str.charCodeAt(i);
    const high = code >> 8;
    if (high !== currHigh) {
      buf[i + offset++] = 0;
      buf[i + offset++] = high;
      currHigh = high;
    }
    const low = code & 0xff;
    buf[i + offset] = low;
    if (!low) {
      buf[i + ++offset] = currHigh;
    }
  }
  return length + offset - start;
};

const fromCharCode = String.fromCharCode;

const fns = new Array(66).fill(null).map((v, i) => (i >= 3 ? makefn(i) : v));

const unpack = (buf, length, offset) => {
  if (length === 0) {
    return "";
  } else if (length === 1) {
    return fromCharCode(buf[offset]);
  } else if (length === 2) {
    const a = buf[offset++];
    if (a === 0) {
      return "\0";
    }
    return fromCharCode(a, buf[offset]);
  } else if (length <= 65) {
    return fns[length](buf, length, offset);
  }
  const end = offset + length;
  let currHighCode = 0;
  let currHigh = 0;
  const codes = [];
  for (let i = offset; i < end; i++) {
    const curr = buf[i];
    if (curr) {
      codes.push(curr + currHigh);
    } else {
      const next = buf[i + 1];
      i += 1;
      if (next === currHighCode) {
        codes.push(curr + currHigh);
      } else {
        currHighCode = next;
        currHigh = next << 8;
      }
    }
  }
  return fromCharCode.apply(null, codes);
};

module.exports.pack = pack;
module.exports.unpack = unpack;
