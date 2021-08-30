const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const getChar = (i) => {
  if (i >= chars.length) {
    const timesBigger = Math.floor(i / chars.length);
    const prefix = "_".repeat(timesBigger);
    const char = chars[i - timesBigger * chars.length];
    return prefix + char;
  }
  return chars[i];
};

const getChars = (i) => {
  return new Array(i).fill().map((_, i) => getChar(i));
};

const generate = (n, i = 0) => {
  if (n == 2) {
    // Can't have high changes anymore
    return `
      let ${getChar(i++)} = buf[offset++];
      if (offset > end) {
        ${getChar(i - 1)} += high;
        return String.fromCharCode(${getChars(i - 1)});
      }
      if (${getChar(i - 1)} === 0) {
        return String.fromCharCode(${getChars(i - 1)}, high);
      }
      ${getChar(i - 1)} += high;
      let ${getChar(i++)} = buf[offset++] + high;
      return String.fromCharCode(${getChars(i)});
    `;
  }
  return `
    let ${getChar(i)} = buf[offset++];
    if (offset > end) {
      ${getChar(i)} += high;
      return String.fromCharCode(${getChars(i)});
    }
    if (${getChar(i)} === 0) {
      next = buf[offset++];
      if (next === highCode) {
        ${getChar(i)} = high;
      } else {
        highCode = next;
        high = next << 8;
        ${getChar(i)} = buf[offset++];
        if (${getChar(i)} === 0) {
          ${getChar(i)} = high;
          offset++
        } else {
          ${getChar(i)} += high;
        }
        if (offset > end) {
          return String.fromCharCode(${getChars(i)});
        }
      }
    } else {
      ${getChar(i)} += high;
    }
    ${generate(n - 1, i + 1)}
  `;
};

const makefn = (n) => {
  const main = generate(n);
  const body = `let highCode = 0; let high = 0; let next; end = offset + length; ${main}`;
  return new Function("buf", "length", "offset", body);
};

module.exports.makefn = makefn;
