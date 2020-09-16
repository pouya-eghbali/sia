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
  While,
} = require("../lab/pl");

const length = 1000;

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

const siaCodeWhileTest = () => {
  const arr = SiaArray(
    Program(
      Var("curr", 0),
      Var("step", 3),
      Var("end", length),
      While(
        IsBigger(Var("end"), Var("curr")),
        Var("sin", Sin(Var("curr"))),
        Var("mul", Mul(Var("curr"), Var("sin"))),
        Push(Var("mul")),
        AddTo(Var("curr"), Var("step"))
      )
    )
  );
  const ser = sia(arr, null, null, 1, 30);
  const res = desia(ser);
  return ser.length;
};

const siaCodeJumpTest = () => {
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
  const ser = sia(arr, null, null, 1, 40);
  const res = desia(ser);
  return ser.length;
};

/* 
const siaHybridTest = () => {
  const arr = [];
  let i = 0;
  while (true) {
    i += 3;
    if (i > length) break;
    arr.push(Mul(i, Sin(i)));
  }
  const ser = sia(arr, null, null, 2, 4500);
  const res = desia(ser);
  return ser.length;
};

const siaTsTest = () => {
  const arrOfSins = () => {
    const arr = [];
    let i = 0;
    while (true) {
      i += 3;
      if (i > length) break;
      const sin = Math.sin(i);
      const mul = i * sin;
      arr.push(mul);
    }
    return arr;
  };
  class ArrOfSins {
    toSia() {
      return {
        constructor: "arrOfSins",
        args: [],
      };
    }
  }
  const ser = sia(new ArrOfSins(), null, null, 1, 20);
  const res = desia(ser, { arrOfSins });
  return ser.length;
};
const siaHybridTsTest = () => {
  const iSin = (i) => i * Math.sin(i);
  const ISin = (i) => ({
    i,
    toSia() {
      return {
        constructor: "iSin",
        args: [this.i],
      };
    },
  });
  const arr = [];
  const max = length;
  let i = 0;
  while (true) {
    i += 3;
    if (i > max) break;
    arr.push(ISin(i));
  }
  const ser = sia(arr, null, null, 2, 5000);
  const res = desia(ser, { iSin });
  return ser.length;
};

const siaArrTest = () => {
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
  const ser = sia(arr, null, null, 2, 3800);
  const res = desia(ser);
  return Buffer.from(ser).length;
}; */

const JSONTest = () => {
  const arr = [];
  const max = length;
  let i = 0;
  while (max > i) {
    const sin = Math.sin(i);
    const mul = i * sin;
    arr.push(mul);
    i += 3;
  }
  const ser = Buffer.from(JSON.stringify(arr));
  const res = JSON.parse(ser.toString());
  return ser.length;
};

benchmark(siaCodeWhileTest, "Sia Code (While)", 1000);
benchmark(siaCodeJumpTest, "Sia Code (Jump)", 1000);
benchmark(JSONTest, "JSON JS Array", 1000);

/* 
benchmark(siaTsTest, "Sia TS", 1000);
benchmark(siaCodeTest, "Sia Code", 1000);
benchmark(siaArrTest, "Sia JS Array", 1000);
benchmark(JSONTest, "JSON JS Array", 1000);
benchmark(siaHybridTest, "Sia Hybrid", 1000);
benchmark(siaHybridTsTest, "Sia Hybrid TS", 1000);
 */
