import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.{test,spec}.{ts,tsx}',
    '**/__tests__/**/!(helpers)/**/*.{ts,tsx}',
    '**/*.{test,spec}.{ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/helpers/',
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: false,
      diagnostics: {
        ignoreCodes: [1343],
      },
      astTransformers: {
        before: [
          {
            path: 'ts-jest-mock-import-meta',
            options: {
              metaObjectReplacement: {
                env: { DEV: true },
              },
            },
          },
        ],
      },
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@fb/(.*)$': '<rootDir>/src/firebase/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.ts',
  },
}

export default config
