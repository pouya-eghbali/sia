const fetch = require("node-fetch");
const prettyBytes = require("pretty-bytes");
const msgpackr = require("msgpackr");
const cborX = require("cbor-x");
const Table = require("cli-table3");
const { sia, desia } = require("..");
const lab = require("../lab/index");
const assert = require("assert");
const { diff } = require("deep-diff");

const runTests = (data, samples) => {
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
  const bench = (serialize, deserialize, name, n = samples) => {
    console.log(`Running benchmarks for ${name}, ${n} loops`);
    const serTimes = [];
    const deserTimes = [];
    let serialized;
    let result;
    while (n--) {
      const serstart = process.cpuUsage();
      serialized = serialize(data);
      const serend = process.cpuUsage(serstart);
      const deserstart = process.cpuUsage();
      result = deserialize(serialized);
      const deserend = process.cpuUsage(deserstart);
      serTimes.push(serend.user);
      deserTimes.push(deserend.user);
    }
    const medSer = Math.min(...serTimes);
    const medDeser = Math.min(...deserTimes);
    const byteSize = serialized.length;
    const serTime = Math.round(medSer) || medSer;
    const deserTime = Math.round(medDeser) || medDeser;
    const total = serTime + deserTime;
    const _diff = diff(result, data);
    if (_diff) {
      console.log(_diff);
    }
    assert.deepEqual(result, data);
    assert;
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
  bench(lab.sia, lab.desia, "Sia Lab");

  bench(msgpackr.pack, msgpackr.unpack, "MessagePack");
  bench((data) => cborX.encode(data), cborX.decode, "CBOR-X");
  console.log();

  const getTime = (ns) => {
    if (ns > 10000) return `${Math.round(ns / 1000)}ms`;
    return `${ns}ns`;
  };

  const jsonResults = results.filter(({ name }) => name == "JSON").pop();
  const rows = results.map((stat) => [
    stat.name,
    getTime(stat.serTime),
    getTime(stat.deserTime),
    getTime(stat.total),
    Math.round((100 * stat.total) / jsonResults.total) / 100,
    prettyBytes(stat.byteSize),
    Math.round((100 * stat.byteSize) / jsonResults.byteSize) / 100,
  ]);
  table.push(...rows);
  console.log(table.toString());
  console.log();
};

const dataset = [
  {
    title: "Tiny file",
    url: "https://jsonplaceholder.typicode.com/users/1",
    samples: 10000,
  },
  {
    title: "Small file",
    url: "https://jsonplaceholder.typicode.com/comments",
    samples: 1000,
  },
  {
    title: "Large file",
    url: "https://jsonplaceholder.typicode.com/photos",
    samples: 1000,
  },
  {
    title: "Monster file",
    url: "https://github.com/json-iterator/test-data/raw/master/large-file.json",
    samples: 100,
  },
];

console.log("Downloading the test data");

const start = async () => {
  for (const set of dataset) {
    const { title, url, samples } = set;
    console.log(`Running tests on "${title}"`);
    const data = set.data || (await fetch(url).then((resp) => resp.json()));
    runTests(data, samples);
  }
};

start().catch(console.trace);
