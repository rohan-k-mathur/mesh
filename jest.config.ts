import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
    transform: { '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^packages/(.*)$": "<rootDir>/packages/$1",
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
  },

  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: [
    "**/tests/**/*.test.ts",
    "**/tests/**/*.test.tsx",
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.test.tsx",
  ],
  testPathIgnorePatterns: [
    "canonicalise.test.ts$",
    "seed_cmd.integration.test.ts$",
  ],
};
export default config;
