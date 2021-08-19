const Benchmark = require("benchmark");
const { Sia, DeSia } = require("..");

const suite = new Benchmark.Suite();

const data = new Set([1, 2, 3, 4]);

const replacer = (_, item) => {
  if (item instanceof Set) {
    return { "@type": "Set", items: [...item.values()] };
  }
  return item;
};

const reviver = (_, object) => {
  if (object?.["@type"] == "Set") {
    return new Set(object.items);
  }
  return object;
};

const constructors = [
  {
    constructor: Set,
    name: "Set",
    args: (item) => [...item.values()],
    build(...values) {
      return new Set(values);
    },
  },
];

const sia = new Sia({ constructors });
const desia = new DeSia({ constructors });

const options = { minSamples: 100 };

// add tests
suite
  .add(
    "JSON",
    function () {
      const buf = Buffer.from(JSON.stringify(data, replacer));
      JSON.parse(buf.toString(), reviver);
    },
    options
  )
  .add(
    "Sia",
    function () {
      const buf = sia.serialize(data);
      desia.deserialize(buf);
    },
    options
  )
  // add listeners
  .on("cycle", function (event) {
    console.log(String(event.target));
  })
  .on("complete", function () {
    console.log("Fastest is " + this.filter("fastest").map("name"));
  })
  // run async
  .run({ async: true });
