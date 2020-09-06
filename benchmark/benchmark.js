const fetch = require("node-fetch");
const prettyBytes = require("pretty-bytes");
const msgpack = require("msgpack5")();
const cbor = require("cbor");
const Table = require("cli-table3");
const convertHrtime = require("convert-hrtime");
const LZ4 = require("lz4");
const { sia, desia } = require("..");
const { sia: siaLab, desia: desiaLab } = require("../lab");

const compress = (input) => {
  const output = Buffer.alloc(LZ4.encodeBound(33554432));
  const compressedSize = LZ4.encodeBlock(input, output);
  return output.slice(0, compressedSize);
};

const decompress = (input) => {
  const uncompressed = Buffer.alloc(33554432);
  const uncompressedSize = LZ4.decodeBlock(input, uncompressed);
  return uncompressed.slice(0, uncompressedSize);
};

const runTests = (data) => {
  const table = new Table({
    head: [
      "Name",
      "Serialize",
      "Deserialize",
      "Total",
      "Ratio",
      "Size",
      "Size ratio",
    ],
  });
  const results = [];
  const sum = (a, b) => a + b;
  const bench = (serialize, deserialize, name, n = 1000) => {
    console.log(`Running benchmarks for ${name}, ${n} loops`);
    const serTimes = [];
    const deserTimes = [];
    let serialized;
    while (n--) {
      const serstart = process.hrtime();
      serialized = serialize(data);
      const serend = process.hrtime(serstart);
      const deserstart = process.hrtime();
      const result = deserialize(serialized);
      const deserend = process.hrtime(deserstart);
      serTimes.push(convertHrtime(serend).milliseconds);
      deserTimes.push(convertHrtime(deserend).milliseconds);
    }
    const averageSer = serTimes.reduce(sum) / serTimes.length;
    const averageDeser = deserTimes.reduce(sum) / deserTimes.length;
    const byteSize = Buffer.from(serialized).length;
    const serTime = Math.round(averageSer);
    const deserTime = Math.round(averageDeser);
    const total = serTime + deserTime;
    results.push({
      name,
      serTime,
      deserTime,
      total,
      byteSize,
    });
  };

  bench(
    (data) => Buffer.from(JSON.stringify(data)),
    (buf) => JSON.parse(buf.toString()),
    "JSON"
  );
  /* bench(
    (data) => compress(Buffer.from(JSON.stringify(data))),
    (buf) => JSON.parse(decompress(buf).toString()),
    "JSON + LZ4"
  ); */
  bench(sia, desia, "Sia");
  bench(siaLab, desiaLab, "Sia Lab");
  /*
  bench(
    (data) => compress(siaLab(data)),
    (data) => {},
    "Sia Lab + LZ4"
  ); */
  /* bench(
    (data) => compress(sia(data)),
    (data) => desia(decompress(data)),
    "Sia + LZ4"
  );*/
  /* bench(msgpack.encode, msgpack.decode, "MessagePack");
  bench(
    (data) => cbor.encodeOne(data, { highWaterMark: 33554432 }),
    cbor.decode,
    "CBOR",
    10 // CBOR is horribly slow
  ); */
  console.log();

  const jsonResults = results.filter(({ name }) => name == "JSON").pop();
  const rows = results.map(({ name, serTime, deserTime, total, byteSize }) => [
    name,
    `${serTime}ms`,
    `${deserTime}ms`,
    `${total}ms`,
    Math.round((100 * total) / jsonResults.total) / 100,
    prettyBytes(byteSize),
    Math.round((100 * byteSize) / jsonResults.byteSize) / 100,
  ]);
  table.push(...rows);
  console.log(table.toString());
};

const fileURL =
  "https://github.com/json-iterator/test-data/raw/master/large-file.json";

console.log("Downloading the test data");

fetch(fileURL)
  .then((resp) => resp.json())
  .then(runTests);
