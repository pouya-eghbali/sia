const pack = (str, buf) => {
  const { length } = str;
  let currHigh = 0;
  let offset = 0;
  for (let i = 0; i < length; i++) {
    const code = str.charCodeAt(i);
    const high = code >> 8;
    if (high !== currHigh) {
      buf[i + offset++] = 0;
      buf[i + offset++] = high;
      currHigh = high;
    }
    buf[i + offset] = code & 0xff; // Low
  }
  return length + offset;
};

const unpack = (buf, length) => {
  let currHigh = 0;
  let str = "";
  for (let i = 0; i < length; i++) {
    const curr = buf[i];
    if (curr === 0) {
      currHigh = buf[++i];
    } else {
      str += String.fromCharCode(buf[i] + (currHigh << 8));
    }
  }
  return str;
};

/* 
const buf = Buffer.alloc(100);
const length = pack("Hello 🌚", buf);
const str = unpack(buf, length);
console.log({ str }); */

module.exports.pack = pack;
module.exports.unpack = unpack;
