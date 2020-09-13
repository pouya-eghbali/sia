const benchmark = require("nodemark");
const data = require("../lab/large-file.json");
const { sia, desia } = require("../lab");

let ser;
const siaCodeResult = benchmark(() => {
  ser = sia(data);
});
const siaDecodeResult = benchmark(() => {
  desia(ser);
});

const jsonCodeResult = benchmark(() => {
  ser = Buffer.from(JSON.stringify(data));
});

const jsonDecodeResult = benchmark(() => {
  JSON.parse(ser.toString());
});

console.log("Sia Compile:", Math.round(siaCodeResult.min / 1000) / 1000);
console.log("Sia Run:", Math.round(siaDecodeResult.min / 1000) / 1000);
console.log("JSON Stringify:", Math.round(jsonCodeResult.min / 1000) / 1000);
console.log("JSON Parse", Math.round(jsonDecodeResult.min / 1000) / 1000);
