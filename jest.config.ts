import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  passWithNoTests: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

export default config
