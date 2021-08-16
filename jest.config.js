module.exports = {
  collectCoverageFrom: [
    "!benchmark/**/*",
    "!docs/**/*",
    "!jest.config.js",
    "!coverage/**/*",
  ],
  moduleFileExtensions: ["js"],
  testEnvironment: "node",
  testTimeout: 30000,
};
