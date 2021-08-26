const Benchmark = require("benchmark");
const { Sia, DeSia } = require("..");
const cborX = require("cbor-x");
const msgpackr = require("msgpackr");

const suite = new Benchmark.Suite();

class Person {
  constructor(name) {
    this.name = name;
  }
}

const pouya = new Person("Pouya");

// JSON
const replacer = (_, item) => {
  if (item instanceof Person) {
    return { "@type": "Person", name: item.name };
  }
  return item;
};

const reviver = (_, object) => {
  if (object?.["@type"] == "Person") {
    return new Person(object.name);
  }
  return object;
};

// Sia
const constructors = [
  {
    constructor: Person,
    code: 2,
    args: (item) => [item.name],
    build: (name) => new Person(name),
  },
];

const sia = new Sia({ constructors });
const desia = new DeSia({ constructors });

// CBOR

cborX.addExtension({
  Class: Person,
  tag: 43311,
  encode(instance, encode) {
    encode(instance.name); // return a buffer
  },
  decode(name) {
    return new Person(name);
  },
});

// MessagePack

msgpackr.addExtension({
  Class: Person,
  type: 11,
  pack(instance) {
    return Buffer.from(instance.name); // return a buffer
  },
  unpack(buffer) {
    new Person(buffer.toString());
  },
});

const options = { minSamples: 100 };

// add tests
suite
  .add(
    "JSON",
    function () {
      const buf = Buffer.from(JSON.stringify(pouya, replacer));
      JSON.parse(buf.toString(), reviver);
    },
    options
  )
  .add(
    "Sia",
    function () {
      const buf = sia.serialize(pouya);
      desia.deserialize(buf);
    },
    options
  )
  .add(
    "CBOR",
    function () {
      const buf = cborX.encode(pouya);
      cborX.decode(buf);
    },
    options
  )
  .add(
    "MessagePack",
    function () {
      const buf = msgpackr.pack(pouya);
      msgpackr.unpack(buf);
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
