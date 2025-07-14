import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
  },
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.jest.json",
    },
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["**/tests/**/*.test.ts", "**/tests/**/*.test.tsx"],
  testPathIgnorePatterns: [
    "canonicalise.test.ts$",
    "seed_cmd.integration.test.ts$",
  ],
};
export default config;
