const { sia, desia } = require("..");

test("Serialize dates", () => {
  const date = new Date();
  const serialized = sia(date);
  const deserialized = desia(serialized);
  expect(deserialized).toBeInstanceOf(Date);
  expect(deserialized).toEqual(date);
});

test("Serialize integers", () => {
  const integer = 42;
  const serialized = sia(integer);
  const deserialized = desia(serialized);
  expect(typeof deserialized).toEqual("number");
  expect(deserialized).toEqual(integer);
});

test("Serialize floats", () => {
  const float = 3.14;
  const serialized = sia(float);
  const deserialized = desia(serialized);
  expect(typeof deserialized).toEqual("number");
  expect(deserialized).toEqual(float);
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

test("Serialize custom classes", () => {
  class Person {
    constructor(name, age) {
      this.name = name;
      this.age = age;
    }
    toSia() {
      return {
        constructor: "Person",
        args: [this.name, this.age],
      };
    }
  }
  const person = new Person("John Doe", 28);
  const serialized = sia(person);
  const deserialized = desia(serialized, {
    Person(name, age) {
      return new Person(name, age);
    },
  });
  expect(deserialized).toBeInstanceOf(Person);
  expect(deserialized).toEqual(person);
});
