const { encodeNumber, decodeNumber } = require("./utils");
const builtinConstructors = require("./constructors");

const SIA_CONSTANTS = {
  TERMINATE: String.fromCharCode(0),
  SEP: String.fromCharCode(1),
  CONSTRUCTOR: String.fromCharCode(2),
  VALUE: String.fromCharCode(3),
  NUMBER: String.fromCharCode(4),
};

class Sia {
  constructor(data) {
    this.data = data;
    this.constructorMap = new Map();
    this.otherMaps = new Map();
    this.stringMap = new Map();
    this.numberMap = new Map();
    this.linesArray = [];
  }
  addLine(line) {
    this.linesArray.push(line);
  }
  getLastItemRef() {
    return encodeNumber(this.linesArray.length - 1);
  }
  getMap(constructorRef) {
    if (this.otherMaps.has(constructorRef))
      return this.otherMaps.get(constructorRef);
    const map = new Map();
    this.otherMaps.set(constructorRef, map);
    return map;
  }
  addConstructor(constructor) {
    if (!this.constructorMap.has(constructor)) {
      const { CONSTRUCTOR } = SIA_CONSTANTS;
      this.addLine(CONSTRUCTOR + constructor);
      const lineNumber = this.getLastItemRef();
      this.constructorMap.set(constructor, lineNumber);
      return lineNumber;
    }
    return this.constructorMap.get(constructor);
  }
  addValue(constructor, args) {
    const constructorRef = this.addConstructor(constructor);
    const map = this.getMap(constructorRef);
    const { VALUE, SEP } = SIA_CONSTANTS;
    const query = args.join(SEP);
    if (!map.has(query)) {
      const lineValue = VALUE + constructorRef + SEP + query;
      this.addLine(lineValue);
      const lineNumber = this.getLastItemRef();
      map.set(query, lineNumber);
      return lineNumber;
    }
    return map.get(query);
  }
  addString(string) {
    if (!this.stringMap.has(string)) {
      this.addLine(string);
      const lineNumber = this.getLastItemRef();
      this.stringMap.set(string, lineNumber);
      return lineNumber;
    }
    return this.stringMap.get(string);
  }
  addNumber(number) {
    const { NUMBER } = SIA_CONSTANTS;
    if (!this.numberMap.has(number)) {
      this.addLine(NUMBER + number);
      const lineNumber = this.getLastItemRef();
      this.numberMap.set(number, lineNumber);
      return lineNumber;
    }
    return this.numberMap.get(number);
  }
  serializeItem(item) {
    if (typeof item === "string") return this.addString(item);
    if (typeof item === "number") return this.addNumber(item);
    if (item && item.constructor === Object) {
      const entries = [];
      for (const key in item)
        entries.push(this.serializeItem(key), this.serializeItem(item[key]));
      const constructor = "Object";
      return this.addValue(constructor, entries);
    }
    if (Array.isArray(item)) {
      const args = item.map((value) => this.serializeItem(value));
      const constructor = "Array";
      return this.addValue(constructor, args);
    }
    const { constructor, args = [] } =
      item && item.toSia && typeof item.toSia === "function"
        ? item.toSia()
        : this.itemtoSia(item);
    const serializedArgs = args.map((value) => this.serializeItem(value));
    return this.addValue(constructor, serializedArgs);
  }
  itemtoSia(item) {
    if (item == null) {
      return {
        constructor: "Null",
        args: [],
      };
    } else if (item == undefined) {
      return {
        constructor: "Undefined",
        args: [],
      };
    } else if (item.constructor === Date) {
      return {
        constructor: "Date",
        args: [encodeNumber(item.valueOf())],
      };
    } else if (item.constructor === RegExp) {
      return {
        constructor: "Regex",
        args: [item.source, item.flags],
      };
    }
    return {
      constructor: item.constructor.name,
      args: [item.toString()],
    };
  }
  serialize() {
    this.serializeItem(this.data);
    return this.linesArray.join(SIA_CONSTANTS.TERMINATE);
  }
}

class DeSia {
  constructor(lines) {
    this.constructorMap = new Map();
    this.valueMap = new Map();
    this.linesArray = lines.split(SIA_CONSTANTS.TERMINATE);
  }
  deserialize(constructors) {
    this.constructors = constructors;
    const lastLine = this.linesArray.pop();
    this.linesArray.forEach((line, index) => this.parseLine(line, index));
    return this.parseLine(lastLine);
  }
  parseLine(line, index) {
    const type = line[0];
    const rest = line.slice(1);
    if (type == SIA_CONSTANTS.CONSTRUCTOR) {
      const constructor = this.constructors[rest];
      this.constructorMap.set(index, constructor);
      return rest;
    }
    if (type == SIA_CONSTANTS.NUMBER) {
      const number = parseFloat(rest);
      this.valueMap.set(index, number);
      return number;
    }
    if (type == SIA_CONSTANTS.VALUE) {
      const [constructorRef, ...argRefs] = rest.split(SIA_CONSTANTS.SEP);
      const constructor = this.constructorMap.get(decodeNumber(constructorRef));
      const args = argRefs
        .map(decodeNumber)
        .map((ref) => this.valueMap.get(ref));
      const value = constructor(...args);
      this.valueMap.set(index, value);
      return value;
    }
    this.valueMap.set(index, line);
    return line;
  }
}

module.exports.sia = (data) => new Sia(data).serialize();
module.exports.desia = (data, constructors = {}) =>
  new DeSia(data).deserialize({ ...builtinConstructors, ...constructors });
