module.exports = {
  testEnvironment: 'node',
  globalSetup: './tests/globalSetup.js',
  globalTeardown: './tests/globalTeardown.js',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'services/**/*.js',
    'controllers/**/*.js',
    'middlewares/**/*.js',
    'utils/**/*.js',
    'providers/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/views/**',
    '!**/public/**'
  ],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true
};
