const WebSocket = require("ws");
const convertHrtime = require("convert-hrtime");
const { DeSia, desia } = require("..");
const { DeSia: DesiaLab, desia: desiaLab } = require("../lab");

const benchmarkJSON = () =>
  new Promise((resolve) => {
    const start = process.hrtime();
    const ws = new WebSocket("ws://localhost:8080/JSON");

    ws.on("message", function incoming(data) {
      JSON.parse(data);
      const end = process.hrtime(start);
      ws.close();
      resolve(convertHrtime(end).milliseconds);
    });
  });

const benchmarkSia = () =>
  new Promise((resolve) => {
    const start = process.hrtime();
    const ws = new WebSocket("ws://localhost:8080/SIA");

    ws.on("message", function incoming(data) {
      desia(data);
      const end = process.hrtime(start);
      ws.close();
      resolve(convertHrtime(end).milliseconds);
    });
  });

const benchmarkSiaS = () =>
  new Promise((resolve) => {
    const start = process.hrtime();
    const deserializer = new DeSia(null, (block) => {
      const end = process.hrtime(start);
      ws.close();
      resolve(convertHrtime(end).milliseconds);
    });
    const ws = new WebSocket("ws://localhost:8080/SIAS");

    ws.on("message", function incoming(data) {
      deserializer.deserializeBlocks(data, 1000);
    });
  });

const benchmarkSiaL = () =>
  new Promise((resolve) => {
    const start = process.hrtime();
    const ws = new WebSocket("ws://localhost:8080/SIAL");

    ws.on("message", function incoming(data) {
      desiaLab(data);
      const end = process.hrtime(start);
      ws.close();
      resolve(convertHrtime(end).milliseconds);
    });
  });

const benchmarkSiaLS = () =>
  new Promise((resolve) => {
    const start = process.hrtime();
    const deserializer = new DesiaLab(null, (block) => {
      const end = process.hrtime(start);
      ws.close();
      resolve(convertHrtime(end).milliseconds);
    });
    const ws = new WebSocket("ws://localhost:8080/SIALS");

    ws.on("message", function incoming(data) {
      deserializer.deserializeBlocks(data, 1000);
    });
  });

const runBenchmarks = async () => {
  await benchmarkJSON().then((ms) => console.log(`JSON took ${ms} ms`));
  await benchmarkSia().then((ms) => console.log(`Sia took ${ms} ms`));
  await benchmarkSiaS().then((ms) => console.log(`Sia Stream took ${ms} ms`));
  await benchmarkSiaL().then((ms) => console.log(`Sia Lab took ${ms} ms`));
  await benchmarkSiaLS().then((ms) =>
    console.log(`Sia Lab Stream took ${ms} ms`)
  );
};

runBenchmarks();
