const fetch = require("node-fetch");
const prettyBytes = require("pretty-bytes");
const msgpackr = require("msgpackr");
const cborX = require("cbor-x");
const Table = require("cli-table3");
const LZ4 = require("lz4");
const { sia, desia } = require("..");
const stats = require("stats-lite");

const compress = (input) => {
  const output = Buffer.alloc(LZ4.encodeBound(5 * 1024 * 1024));
  const compressedSize = LZ4.encodeBlock(input, output);
  return output.slice(0, compressedSize);
};

const decompress = (input) => {
  const uncompressed = Buffer.alloc(26 * 1024 * 1024);
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
  const bench = (serialize, deserialize, name, n = 10000) => {
    console.log(`Running benchmarks for ${name}, ${n} loops`);
    const serTimes = [];
    const deserTimes = [];
    let serialized;
    while (n--) {
      const serstart = process.cpuUsage();
      serialized = serialize(data);
      const serend = process.cpuUsage(serstart);
      const deserstart = process.cpuUsage();
      const result = deserialize(serialized);
      const deserend = process.cpuUsage(deserstart);
      serTimes.push(serend.user);
      deserTimes.push(deserend.user);
    }
    const medSer = stats.median(serTimes);
    const medDeser = stats.median(deserTimes);
    const byteSize = Buffer.from(serialized).length;
    const serTime = Math.round(medSer);
    const deserTime = Math.round(medDeser);
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

  bench(sia, desia, "Sia");
  /* 
  bench(
    (data) => compress(sia(data)),
    (data) => desia(decompress(data)),
    "Sia + LZ4"
  ); */

  bench(msgpackr.pack, msgpackr.unpack, "MessagePack");
  bench((data) => cborX.encode(data), cborX.decode, "CBOR-X", 100);
  console.log();

  const jsonResults = results.filter(({ name }) => name == "JSON").pop();
  const rows = results.map((stat) => [
    stat.name,
    `${stat.serTime}ms`,
    `${stat.deserTime}ms`,
    `${stat.total}ms`,
    Math.round((100 * stat.total) / jsonResults.total) / 100,
    prettyBytes(stat.byteSize),
    Math.round((100 * stat.byteSize) / jsonResults.byteSize) / 100,
  ]);
  table.push(...rows);
  console.log(table.toString());
};

const dataset = [
  {
    title: "Large file",
    json: "https://github.com/json-iterator/test-data/raw/master/large-file.json",
  },
];

console.log("Downloading the test data");

const start = async () => {
  for (const { title, json } of dataset) {
    console.log(`Running tests on "${title}"`);
    await fetch(json)
      .then((resp) => resp.json())
      .then(runTests);
  }
};

start();
