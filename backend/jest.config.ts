import type { Config } from "jest";

const config: Config = {
  preset:             "ts-jest",
  testEnvironment:    "node",
  rootDir:            ".",
  testMatch:          ["**/__tests__/**/*.test.ts"],
  moduleNameMapper:   { "^@/(.*)$": "<rootDir>/src/$1" },
  globalSetup:        "./src/__tests__/setup/globalSetup.ts",
  globalTeardown:     "./src/__tests__/setup/globalTeardown.ts",
  setupFilesAfterEnv: ["./src/__tests__/setup/jest.setup.ts"],
  collectCoverageFrom: [
    "src/domains/**/*.ts",
    "!src/domains/**/*.validator.ts",
    "!src/**/__tests__/**",
  ],
  coverageThreshold: {
    global: { branches: 60, functions: 70, lines: 70 },
  },
  testTimeout:        15000,
  verbose:            true,
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "./tsconfig.test.json" }],
  },
};

export default config;
