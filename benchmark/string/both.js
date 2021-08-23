const Benchmark = require("benchmark");
const utf8 = require("utf8-buffer");
const utfComposite = require("../utf-composite");
const protobuf = require("@protobufjs/utf8");
const msgpackr = require("../msgpackr");

const options = {};

for (const size of new Array(30).fill().map((_, i) => i * 3 + 1)) {
  const suite = new Benchmark.Suite();

  const message = "a".repeat(size);

  const buf1 = Buffer.alloc(1000);
  const buf2 = Buffer.alloc(1000);
  const buf3 = Buffer.alloc(1000);
  const buf4 = Buffer.alloc(1000);
  const buf5 = Buffer.alloc(1000);

  console.log(`Running tests for size: ${size}`);
  // add tests
  suite
    .add(
      "Buffer.toString",
      function () {
        const length = buf1.write(message);
        buf1.toString("utf8", 0, length);
      },
      options
    )
    .add(
      "utf8-buffer",
      function () {
        const length = utf8.pack(message, buf2);
        utf8.unpack(buf2, 0, length);
      },
      options
    )
    .add(
      "utfz",
      function () {
        const length = utfComposite.pack(message, buf3);
        utfComposite.unpack(buf3, length);
      },
      options
    )
    .add(
      "protobuf/utf8",
      function () {
        const length = protobuf.write(message, buf4, 0);
        protobuf.read(buf4, 0, length);
      },
      options
    )
    .add(
      "msgpackr",
      function () {
        const length = msgpackr.write(buf5, 0, message, message.length);
        msgpackr.read(buf5, 0, length);
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
