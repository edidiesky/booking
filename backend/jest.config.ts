import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  // Unit tests must NOT load integration Testcontainers setup
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup/jest.setup.ts"],
  testMatch: ["**/__tests__/unit/**/*.test.ts"],
  collectCoverageFrom: [
    "src/domains/**/*.ts",
    "!src/domains/**/*.validator.ts",
    "!src/**/__tests__/**",
  ],
  coverageThreshold: {
    global: { branches: 60, functions: 70, lines: 70 },
  },
  testTimeout: 15_000,
  verbose: true,
  clearMocks: true,
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
        },
      },
    ],
  },
};

export default config;