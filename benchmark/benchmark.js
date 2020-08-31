const fetch = require("node-fetch");
const prettyBytes = require("pretty-bytes");
const msgpack = require("msgpack5")();
const cbor = require("cbor");
const Table = require("cli-table3");
const convertHrtime = require("convert-hrtime");
const { sia, desia } = require("..");

const runTests = (data) => {
  console.log("Running SIA benchmarks");
  console.log();
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
  const bench = (serialize, deserialize, name) => {
    const serstart = process.hrtime();
    const serialized = serialize(data);
    const serend = process.hrtime(serstart);
    const deserstart = process.hrtime();
    const result = deserialize(serialized);
    const deserend = process.hrtime(deserstart);
    console.info(`${name}:`);
    console.info(
      "Serialization time (hr): %ds %dms",
      serend[0],
      serend[1] / 1000000
    );
    console.info(
      "Deserialization time (hr): %ds %dms",
      deserend[0],
      deserend[1] / 1000000
    );
    console.info("Char count:", serialized.length);
    const byteSize = Buffer.from(serialized).length;
    const size = prettyBytes(byteSize);
    console.info("Size:", size);
    console.log();
    const serTime = Math.round(convertHrtime(serend).milliseconds);
    const deserTime = Math.round(convertHrtime(deserend).milliseconds);
    const total = serTime + deserTime;
    results.push({
      name,
      serTime,
      deserTime,
      total,
      byteSize,
    });
  };

  bench(JSON.stringify, JSON.parse, "JSON");
  bench(sia, desia, "Sia");
  bench(msgpack.encode, msgpack.decode, "MessagePack");
  bench(
    (data) => cbor.encodeOne(data, { highWaterMark: 33554432 }),
    cbor.decode,
    "CBOR"
  );
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
