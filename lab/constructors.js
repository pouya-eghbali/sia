module.exports = [
  {
    constructor: RegExp,
    name: "RegExp",
    args: (item) => [item.source, item.flags],
    build(source, flags) {
      return new RegExp(source, flags);
    },
  },
  {
    constructor: Date,
    name: "Date",
    args: (item) => [item.valueOf()],
    build(value) {
      return new Date(value);
    },
  },
];
