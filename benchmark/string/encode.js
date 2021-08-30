const Benchmark = require("benchmark");
const utf8 = require("utf8-buffer");
const utfComposite = require("../utf-composite");
const msgpackr = require("../msgpackr");

const options = {};

const sizes = new Array(40).fill().map((_, i) => i + 1);

for (const size of sizes) {
  const suite = new Benchmark.Suite();
  const buf = Buffer.alloc(1000);
  const message = "x".repeat(size);

  console.log(`Running tests for size: ${size}`);
  // add tests
  suite
    .add(
      "Buffer.write",
      function () {
        buf.write(message);
      },
      options
    )
    .add(
      "utf8.pack",
      function () {
        utf8.pack(message, buf);
      },
      options
    )
    .add(
      "utfComposite.pack",
      function () {
        utfComposite.pack(message, message.length, buf, 0);
      },
      options
    )
    .add(
      "msgpackr",
      function () {
        msgpackr.write(buf, 0, message, message.length);
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
}
