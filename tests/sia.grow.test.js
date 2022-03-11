const { Sia, DeSia } = require("..");
const fetch = require("node-fetch");
const deepEqual = require("deep-equal");

const _Sia = new Sia({ autoGrow: true, size: 1024 });
const _Desia = new DeSia();

const sia = (data) => _Sia.serialize(data);
const desia = (data) => _Desia.deserialize(data);

const random = (n) =>
  [...Array(n)].map(() => (~~(Math.random() * 36)).toString(36)).join("");

test("Serialize dates", () => {
  const date = new Date();
  const serialized = sia(date);
  const deserialized = desia(serialized);
  expect(deserialized).toBeInstanceOf(Date);
  expect(deserialized).toEqual(date);
});

test("Serialize sets", () => {
  const set = new Set([1, 2, 3]);
  const serialized = sia(set);
  const deserialized = desia(serialized);
  expect(deserialized).toBeInstanceOf(Set);
  expect(deserialized).toEqual(set);
});

test("Serialize maps", () => {
  const map = new Map([
    [1, 2],
    [2, 3],
  ]);
  const serialized = sia(map);
  const deserialized = desia(serialized);
  expect(deserialized).toBeInstanceOf(Map);
  expect(deserialized).toEqual(map);
});

test("Serialize integers", () => {
  const integers = [0x10, 0x100, 0x10000, 0x100000000];
  const serialized = sia(integers);
  const deserialized = desia(serialized);
  expect(deserialized).toEqual(integers);
});

test("Serialize negative integers", () => {
  const integers = [-0x10, -0x100, -0x10000, -0x100000000];
  const serialized = sia(integers);
  const deserialized = desia(serialized);
  expect(deserialized).toEqual(integers);
});

test("Serialize floats", () => {
  const float = 3.14;
  const serialized = sia(float);
  const deserialized = desia(serialized);
  expect(typeof deserialized).toEqual("number");
  expect(deserialized).toEqual(float);
});

test("Serialize array of floats", () => {
  const floats = [3.14, 3.14];
  const serialized = sia(floats);
  const deserialized = desia(serialized);
  expect(deserialized).toEqual(floats);
});

test("Serialize big array", () => {
  const strings = new Array(0x10000).fill("X");
  const serialized = sia(strings);
  const deserialized = desia(serialized);
  expect(deserialized).toEqual(strings);
});

test("Serialize string8 keys", () => {
  const object = Object.fromEntries([["a".repeat(61), null]]);
  const serialized = sia(object);
  const deserialized = desia(serialized);
  expect(deserialized).toEqual(object);
});

test("Serialize big strings", () => {
  const strings = ["a".repeat(0x100), "b".repeat(0x10000)];
  const serialized = sia(strings);
  const deserialized = desia(serialized);
  expect(deserialized).toEqual(strings);
});

test("Serialize object with big keys", () => {
  const object = Object.fromEntries([
    ["a".repeat(0x100), null],
    ["b".repeat(0x10000), null],
  ]);
  const serialized = sia(object);
  const deserialized = desia(serialized);
  expect(deserialized).toEqual(object);
});

test("Serialize boolean", () => {
  const t = true;
  const serialized = sia(t);
  const deserialized = desia(serialized);
  expect(typeof deserialized).toEqual("boolean");
  expect(deserialized).toEqual(t);
});

test("Serialize regex", () => {
  const regex = /SIA+/i;
  const serialized = sia(regex);
  const deserialized = desia(serialized);
  expect(deserialized).toBeInstanceOf(RegExp);
  expect(deserialized).toEqual(regex);
});

test("Serialize strings", () => {
  const string = "Hello world!";
  const serialized = sia(string);
  const deserialized = desia(serialized);
  expect(typeof deserialized).toBe("string");
  expect(deserialized).toEqual(string);
});

test("Serialize arrays", () => {
  const array = [1, 2, 3];
  const serialized = sia(array);
  const deserialized = desia(serialized);
  expect(deserialized).toEqual(array);
});

test("Serialize objects", () => {
  const object = { abc: { xyz: 100 } };
  const serialized = sia(object);
  const deserialized = desia(serialized);
  expect(deserialized).toEqual(object);
});

test("Serialize object with uint16 keys", () => {
  const object = Object.fromEntries(
    new Array(0x1200).fill().map(() => [random(40), null])
  );
  const objects = [object, object];
  const serialized = sia(objects);
  const deserialized = desia(serialized);
  expect(deserialized).toEqual(objects);
});

test("Serialize object with uint32 keys", () => {
  const object = Object.fromEntries(
    new Array(0x12000).fill().map(() => [random(40), null])
  );
  const objects = [object, object];
  const serialized = sia(objects);
  const deserialized = desia(serialized);
  expect(deserialized).toEqual(objects);
});

test("Serialize undefined", () => {
  const object = { abc: { xyz: undefined } };
  const serialized = sia(object);
  const deserialized = desia(serialized);
  expect(deserialized).toEqual(object);
});

test("Serialize custom classes", () => {
  class Person {
    constructor(name) {
      this.name = name;
    }
  }
  const constructors = [
    {
      constructor: Person,
      code: 2,
      args: (item) => [item.name],
      build: (name) => new Person(name),
    },
  ];
  const pouya = new Person("Pouya");
  const sia = new Sia({ constructors, autoGrow: true, size: 1024 });
  const desia = new DeSia({ constructors });
  const deserialized = desia.deserialize(sia.serialize(pouya));
  expect(deserialized).toBeInstanceOf(Person);
  expect(deserialized.name).toEqual("Pouya");
});

test("Serialize custom classes with uint16 code size", () => {
  class Person {
    constructor(name) {
      this.name = name;
    }
  }
  const constructors = [
    {
      constructor: Person,
      code: 0x100,
      args: (item) => [item.name],
      build: (name) => new Person(name),
    },
  ];
  const pouya = new Person("Pouya");
  const sia = new Sia({ constructors, autoGrow: true, size: 1024 });
  const desia = new DeSia({ constructors });
  const deserialized = desia.deserialize(sia.serialize(pouya));
  expect(deserialized).toBeInstanceOf(Person);
  expect(deserialized.name).toEqual("Pouya");
});

test("Serialize custom classes with uint32 code size", () => {
  class Person {
    constructor(name) {
      this.name = name;
    }
  }
  const constructors = [
    {
      constructor: Person,
      code: 0x10000,
      args: (item) => [item.name],
      build: (name) => new Person(name),
    },
  ];
  const pouya = new Person("Pouya");
  const sia = new Sia({ constructors, autoGrow: true, size: 1024 });
  const desia = new DeSia({ constructors });
  const deserialized = desia.deserialize(sia.serialize(pouya));
  expect(deserialized).toBeInstanceOf(Person);
  expect(deserialized.name).toEqual("Pouya");
});

test("Serialize uint8 size buffer", () => {
  const buf = Buffer.alloc(0x10);
  const serialized = sia(buf);
  const deserialized = desia(serialized);
  expect(deserialized).toEqual(buf);
});

test("Serialize uint16 size buffer", () => {
  const buf = Buffer.alloc(0x100);
  const serialized = sia(buf);
  const deserialized = desia(serialized);
  expect(deserialized).toEqual(buf);
});

test("Serialize uint32 size buffer", () => {
  const buf = Buffer.alloc(0x10000);
  const serialized = sia(buf);
  const deserialized = desia(serialized);
  expect(deserialized).toEqual(buf);
});

test("Throw on custom classes with huge code size", () => {
  class Person {
    constructor(name) {
      this.name = name;
    }
  }
  const constructors = [
    {
      constructor: Person,
      code: 0x1000000000,
      args: (item) => [item.name],
      build: (name) => new Person(name),
    },
  ];
  const pouya = new Person("Pouya");
  const sia = new Sia({ constructors, autoGrow: true, size: 1024 });
  const desia = new DeSia({ constructors });
  const deserialize = () => desia.deserialize(sia.serialize(pouya));
  expect(deserialize).toThrow(`Code ${0x1000000000} too big for a constructor`);
});

test("Throw on unknow constructor, uint8", () => {
  class Person {
    constructor(name) {
      this.name = name;
    }
  }
  const constructors = [
    {
      constructor: Person,
      code: 0x10,
      args: (item) => [item.name],
      build: (name) => new Person(name),
    },
  ];
  const pouya = new Person("Pouya");
  const sia = new Sia({ constructors, autoGrow: true, size: 1024 });
  const desia = new DeSia({ constructors: [] });
  const deserialize = () => desia.deserialize(sia.serialize(pouya));
  expect(deserialize).toThrow(`Constructor ${0x10} is unknown`);
});

test("Throw on unknow constructor, uint16", () => {
  class Person {
    constructor(name) {
      this.name = name;
    }
  }
  const constructors = [
    {
      constructor: Person,
      code: 0x100,
      args: (item) => [item.name],
      build: (name) => new Person(name),
    },
  ];
  const pouya = new Person("Pouya");
  const sia = new Sia({ constructors, autoGrow: true, size: 1024 });
  const desia = new DeSia({ constructors: [] });
  const deserialize = () => desia.deserialize(sia.serialize(pouya));
  expect(deserialize).toThrow(`Constructor ${0x100} is unknown`);
});

test("Throw on unknow constructor, uint32", () => {
  class Person {
    constructor(name) {
      this.name = name;
    }
  }
  const constructors = [
    {
      constructor: Person,
      code: 0x10000,
      args: (item) => [item.name],
      build: (name) => new Person(name),
    },
  ];
  const pouya = new Person("Pouya");
  const sia = new Sia({ constructors, autoGrow: true, size: 1024 });
  const desia = new DeSia({ constructors: [] });
  const deserialize = () => desia.deserialize(sia.serialize(pouya));
  expect(deserialize).toThrow(`Constructor ${0x10000} is unknown`);
});

test("Throw on unsupported class", () => {
  const constructors = [];
  const sia = new Sia({ constructors, autoGrow: true, size: 1024 });
  const date = new Date();
  expect(() => sia.serialize(date)).toThrow(
    `Serialization of item ${date} is not supported`
  );
});

test("Throw on unsupported key type", () => {
  const constructors = [];
  const sia = new Sia({ constructors, autoGrow: true, size: 1024 });
  sia.startObject();
  sia.addNull();
  sia.addNull();
  sia.endObject();
  const buf = sia.buffer.subarray(0, 5);
  expect(() => desia(buf)).toThrow(`Key of type 0 is invalid.`);
});

test("Throw on unsupported type", () => {
  const buf = Buffer.from([0x42]);
  expect(() => desia(buf)).toThrow("Unsupported type: 66");
});

test("Throw on huge ref", () => {
  const sia = new Sia({ autoGrow: true, size: 1024 });
  expect(() => sia.addRef(999999999999)).toThrow(
    "Ref size 999999999999 is too big"
  );
});

test("Throw on huge array", () => {
  const length = 0x100000000;
  const hugeArray = new Proxy([], {
    get(target, prop, receiver) {
      if (prop === "length") return length;
      return Reflect.get(target, prop, receiver);
    },
  });
  expect(() => sia(hugeArray)).toThrow(
    `Array of size ${length} is too big to serialize`
  );
});

test("Throw on huge buffer", () => {
  const length = 0x100000000;
  const hugeArray = new Proxy(Buffer.alloc(100), {
    get(target, prop, receiver) {
      if (prop === "length") return length;
      return Reflect.get(target, prop, receiver);
    },
  });
  expect(() => sia(hugeArray)).toThrow(
    `Buffer of size ${length} is too big to serialize`
  );
});

test(
  "Serialize huge sample data",
  async () => {
    const data = await fetch(
      "https://github.com/json-iterator/test-data/raw/master/large-file.json"
    ).then((resp) => resp.json());
    const serialized = sia(data);
    const deserialized = desia(serialized);
    expect(deepEqual(deserialized, data)).toBe(true);
  },
  60 * 1000
);

test("Handle string greater than buffer size", () => {
  const s = Array(2000).fill('x').join('');
  const serialized = sia(s);
  const deserialized = desia(serialized);
  expect(deserialized).toEqual(s);
});

