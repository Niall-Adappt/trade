module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: [
        "**/__tests__/**/*.[jt]s?(x)", // This is Jest's default and should catch your file
        "**/?(*.)+(spec|test).[tj]s?(x)" // This should also catch your file
      ],
    // testMatch: [
    //   "**/__tests__/**/*.ts?(x)", // For mirrored folder structure
    //   "**/?(*.)+(spec|test).ts?(x)" // For inline tests
    // ],
    transform: {
      "^.+\\.(ts|tsx)$": "ts-jest"
    },
  };
  