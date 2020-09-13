const convertHrtime = require("convert-hrtime");
const prettyBytes = require("pretty-bytes");

const { sia, desia } = require("../lab");
const {
  Program,
  SiaArray,
  Var,
  AddTo,
  If,
  IsBigger,
  Exit,
  Jump,
  Line,
  Push,
  Sin,
  Mul,
} = require("../lab/pl");

const length = 10000;

const benchmark = (fn, name, n) => {
  const times = [];
  let size;
  while (n--) {
    const serstart = process.cpuUsage();
    size = fn();
    const serend = process.cpuUsage(serstart);
    times.push(serend.user);
  }
  const min = Math.min(...times);
  console.log(`${name} took ${Math.floor(min)}μs, size: ${prettyBytes(size)}`);
};

const siaTest = () => {
  const arr = SiaArray(
    Program(
      Var("curr", 0),
      Var("step", 3),
      Var("end", length),
      Line("start", AddTo(Var("curr"), Var("step"))),
      If(IsBigger(Var("curr"), Var("end")), Exit()),
      Var("sin", Sin(Var("curr"))),
      Var("mul", Mul(Var("curr"), Var("sin"))),
      Push(Var("mul")),
      Jump(Line("start"))
    )
  );
  const ser = sia(arr, null, null, 1);
  const res = desia(ser);
  return ser.length;
};

const JSONTest = () => {
  const arr = [];
  const max = length;
  let i = 0;
  while (true) {
    i += 3;
    if (i > max) break;
    const sin = Math.sin(i);
    const mul = i * sin;
    arr.push(mul);
  }
  const ser = JSON.stringify(arr);
  const res = JSON.parse(ser);
  return Buffer.from(ser).length;
};

benchmark(siaTest, "Sia Assembly", 1000);
benchmark(JSONTest, "JSON JS Array", 1000);
