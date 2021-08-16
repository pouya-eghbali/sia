module.exports = {
  Regex(source, flags) {
    return new RegExp(source, flags);
  },
  Date(value) {
    return new Date(value);
  },
};
