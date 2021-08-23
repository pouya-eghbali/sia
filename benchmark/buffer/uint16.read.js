const Benchmark = require("benchmark");

const options = {};

const suite = new Benchmark.Suite();
const buf = Buffer.alloc(1000);
buf.writeUInt16LE(45982);

// add tests
suite
  .add(
    "Buffer.readUInt16LE",
    function () {
      buf.readUInt16LE(0);
    },
    options
  )
  .add(
    "Copy over",
    function () {
      (buf[0] << 8) + buf[1];
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
