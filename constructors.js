const { decodeNumber } = require("./utils");

module.exports = {
  Regex(source, flags) {
    return new RegExp(source, flags);
  },
  Date(value) {
    return new Date(decodeNumber(value));
  },
  Array(...args) {
    return args;
  },
  Object(...keyValues) {
    let { length } = keyValues,
      index = 0;
    const object = {};
    while (index < length) {
      object[keyValues[index]] = keyValues[index + 1];
      index += 2;
    }
    return object;
  },
  Boolean(value) {
    return value === "true";
  },
  Null() {
    return null;
  },
  Undefined() {
    return undefined;
  },
};
