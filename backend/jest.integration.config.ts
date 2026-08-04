import type { Config } from "jest";

const config: Config = {
  displayName:        "integration",
  preset:              "ts-jest",
  testEnvironment:     "node",
  rootDir:             ".",
  testMatch:           ["**/__tests__/integration/**/*.integration.test.ts"],
  moduleNameMapper:    { "^@/(.*)$": "<rootDir>/src/$1" },
  testTimeout:         60_000,
  forceExit:           true,
  verbose:             true,
  globalSetup:         "./src/__tests__/integration/setup/globalSetup.ts",
  globalTeardown:      "./src/__tests__/integration/setup/globalTeardown.ts",
  setupFilesAfterEnv:  ["./src/__tests__/integration/setup/setupFiles.ts"],
  collectCoverageFrom: ["src/domains/**/*.service.ts", "src/domains/**/*.repository.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "./tsconfig.test.json" }],
  },
};

export default config;