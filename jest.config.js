module.exports = {
  collectCoverageFrom: [
    "!benchmark/**/*",
    "!lab/**/*",
    "!docs/**/*",
    "!jest.config.js",
    "!coverage/**/*",
  ],
  moduleFileExtensions: ["js"],
  testEnvironment: "node",
  testTimeout: 30000,
};
