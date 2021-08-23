const Benchmark = require("benchmark");
const lzutf8 = require("lzutf8");
const iconv = require("iconv-lite");

const string = `[02:48:59] Poulern: http://puu.sh/dIqRL/1d8422a923.png
[02:55:08] Poulern: but i get this erorr
[02:55:13] Poulern: every tiem
[02:55:28] Nick van der Lee: I wanted it designated by side instead of faction
[02:56:02] Nick van der Lee: OH
[02:56:15] Nick van der Lee: Try (str(side player) )
[02:56:45] Poulern: _unitSide = toLower (side player);
[02:56:51] Poulern: _unitSide = (str(side player) )
[02:56:53] Poulern: ?
[02:56:55] Poulern: like so
[02:57:12] Nick van der Lee: _unitSide = toLower (str(side player))
[02:58:03] Poulern: if (_unitSide != toLower (faction (leader group player))) then {_unitSide = toLower (faction (leader group player))};
[02:58:06] Poulern: error missing ;
[02:58:21] Nick van der Lee: Delete that part
[02:58:26] Nick van der Lee: It's obsolete
[02:58:38] Poulern: Make sure to fix the main
[02:58:46] Nick van der Lee: Make a ticket
[02:58:48] Poulern: briefing.sqf in the F3_PA
[02:58:51] Poulern: okay man
[02:58:55] Nick van der Lee: I'll need to fix in main F3 too
[02:59:11] Nick van der Lee: It's 3 AM I ain't gonna remember : P
`;

const suite = new Benchmark.Suite();
const buf = Buffer.alloc(5000);

const decoder = new TextDecoder();

const options = {};

suite
  .add(
    "Buffer.toString",
    function () {
      const length = buf.write(string);
      buf.toString("utf8", 0, length);
    },
    options
  )
  .add(
    "lzutf8",
    function () {
      const compressed = lzutf8.compress(string);
      let i = 0;
      for (const byte of compressed) buf[i++] = byte;
      lzutf8.decompress(buf.subarray(0, i - 1));
    },
    options
  )
  .add(
    "iconv.decode",
    function () {
      const length = buf.write(string);
      iconv.decode(buf.subarray(0, length), "utf8");
    },
    options
  )
  .add(
    "TextDecoder",
    function () {
      const length = buf.write(string);
      decoder.decode(buf.subarray(0, length));
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
