const fetch = require("node-fetch");
const prettyBytes = require("pretty-bytes");
const { sia, desia } = require("..");

const runTests = (data) => {
  console.log("Running SIA benchmarks");
  console.log();
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
    const size = prettyBytes(Buffer.from(serialized).length);
    console.info("Size:", size);
    console.log();
  };

  bench(sia, desia, "SIA");
  bench(JSON.stringify, JSON.parse, "JSON");
};

const fileURL =
  "https://github.com/json-iterator/test-data/raw/master/large-file.json";

console.log("Downloading the test data");

fetch(fileURL)
  .then((resp) => resp.json())
  .then(runTests);
