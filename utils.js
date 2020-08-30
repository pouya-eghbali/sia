function encodeNumber(num) {
  const result = [];
  while (num > 0) {
    const R = num % 254;
    result.push(R + 2);
    num = (num - R) / 254;
  }
  return String.fromCharCode(...result);
}

function decodeNumber(str) {
  return [...str].reduce(
    (prev, curr, i) => prev + (curr.charCodeAt(0) - 2) * Math.pow(254, i),
    0
  );
}

module.exports.encodeNumber = encodeNumber;
module.exports.decodeNumber = decodeNumber;
