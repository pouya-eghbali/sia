const types = require("./types");

const byteSizeOfPositive = (n) => {
  if (n < 0x100) {
    return 1;
  } else if (n < 0x10000) {
    return 2;
  } else if (n < 0x1000000) {
    return 3;
  } else if (n < 0x100000000) {
    return 4;
  } else if (n < 0x10000000000) {
    return 5;
  }
  return 6;
};
const byteSizeOfNegative = (n) => {
  if (n >= -0x80) {
    return 1;
  } else if (n >= -0x8000) {
    return 2;
  } else if (n >= -0x800000) {
    return 3;
  } else if (n >= -0x80000000) {
    return 4;
  } else if (n >= -0x8000000000) {
    return 5;
  }
  return 6;
};

const positiveNumberTypes = [
  null,
  types.int8,
  types.int16,
  types.int24,
  types.int32,
  types.int40,
  types.int48,
];

const negativeNumberTypes = [
  null,
  types.uint8,
  types.uint16,
  types.uint24,
  types.uint32,
  types.uint40,
  types.uint48,
];

module.exports.byteSizeOfPositive = byteSizeOfPositive;
module.exports.byteSizeOfNegative = byteSizeOfNegative;
module.exports.positiveNumberTypes = positiveNumberTypes;
module.exports.negativeNumberTypes = negativeNumberTypes;
