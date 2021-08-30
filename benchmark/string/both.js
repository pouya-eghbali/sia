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
  const buf6 = Buffer.alloc(1000);
  const buf7 = Buffer.alloc(1000);

  const { fromCharCode } = String;

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
        const length = utfComposite.pack(message, message.length, buf3, 0);
        utfComposite.unpack(buf3, length, 0);
      },
      options
    )
    .add(
      "utf16",
      function () {
        const { length } = message;
        for (let i = 0; i < length; i++) {
          const code = message.charCodeAt(i);
          buf6[i * 2] = code >> 8;
          buf6[i * 2 + 1] = code & 0xff;
        }
        buf6.toString("utf16le", 0, length);
      },
      options
    )
    .add(
      "utf16raw",
      function () {
        const { length } = message;
        for (let i = 0; i < length; i++) {
          const code = message.charCodeAt(i);
          buf7[i * 2] = code >> 8;
          buf7[i * 2 + 1] = code & 0xff;
        }
        const units = [];
        for (let i = 0; i < length; i++) {
          units.push((buf7[i * 2] << 8) + buf7[i * 2 + 1]);
        }
        fromCharCode.apply(null, units);
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
