const Benchmark = require("benchmark");
const utf8 = require("utf8-buffer");
const utfComposite = require("../utf-composite");
const msgpackr = require("../msgpackr");

const options = {};

const sizes = new Array(35).fill().map((_, i) => i + 37);

for (const size of sizes) {
  const suite = new Benchmark.Suite();

  const message = "x".repeat(size);

  const buf1 = Buffer.alloc(1000);
  const lbuf = buf1.write(message);

  const buf2 = Buffer.alloc(1000);
  const lutf = utf8.pack(message, buf2);

  const buf3 = Buffer.alloc(1000);
  const lcom = utfComposite.pack(message, message.length, buf3, 0);

  const buf4 = Buffer.alloc(1000);
  const lmsg = msgpackr.write(buf4, 0, message, message.length);

  console.log(`Running tests for size: ${size}`);
  // add tests
  suite
    .add(
      "Buffer.toString",
      function () {
        buf1.toString("utf8", 0, lbuf);
      },
      options
    )
    .add(
      "utf8.unpack",
      function () {
        utf8.unpack(buf2, 0, lutf);
      },
      options
    )
    .add(
      "utfComposite.unpack",
      function () {
        utfComposite.unpack(buf3, lcom, 0);
      },
      options
    )
    .add(
      "msgpackr",
      function () {
        msgpackr.read(buf4, 0, lmsg);
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
