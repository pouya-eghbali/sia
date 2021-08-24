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
    if (low === 0) {
      buf[i + ++offset] = currHigh;
    }
  }
  return length + offset - start;
};

const fromCharCode = String.fromCharCode;

const unpack = (buf, length, offset) => {
  const end = offset + length;
  let currHigh = 0;
  const codes = [];
  for (let i = offset; i < end; i++) {
    const curr = buf[i];
    if (curr === 0) {
      if (buf[i + 1] === currHigh) {
        codes.push(buf[i++] + (currHigh << 8));
      } else {
        currHigh = buf[++i];
      }
    } else {
      codes.push(buf[i] + (currHigh << 8));
    }
  }
  return fromCharCode.apply(null, codes);
};

module.exports.pack = pack;
module.exports.unpack = unpack;
