const Benchmark = require("benchmark");

const options = {};

const suite = new Benchmark.Suite();
const buf = Buffer.alloc(1000);
buf.writeUInt8(232);

// add tests
suite
  .add(
    "Buffer.readUInt8",
    function () {
      buf.readUInt8(0);
    },
    options
  )
  .add(
    "Copy over",
    function () {
      buf[0];
    },
    options
  )
  // add listeners
  .on("cycle", function (event) {
    console.log(String(event.target));
  })
  .on("complete", function () {
    console.log("Fastest is " + this.filter("fastest").map("name") + "\n");
  })
  // run async
  .run();
