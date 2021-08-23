const Benchmark = require("benchmark");

const options = {};

const suite = new Benchmark.Suite();
const buf = Buffer.alloc(1000);

// add tests
suite
  .add(
    "Buffer.writeUInt16LE",
    function () {
      buf.writeUInt16LE(45982);
    },
    options
  )
  .add(
    "Copy over",
    function () {
      buf[0] = 45982 >> 8;
      buf[1] = 45982 & 0xff;
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
