/**
 * jest.config.js
 *
 * Jest configuration for the auth test suite.
 *
 * Key decisions:
 *  • testEnvironment: "node"  — no browser globals needed
 *  • setupFilesAfterFramework → tests/setup.js spins up MongoMemoryServer
 *  • testTimeout: 30_000      — MongoMemoryServer download + bcrypt can be slow
 *  • runInBand is passed via npm script ("jest --runInBand") so each test file
 *    runs in the same process; this is important for the rate-limiter tests
 *    because express-rate-limit uses an in-memory store that resets only on
 *    process restart, and running all files in the same process lets us
 *    control which bucket each test drains.
 */

/** @type {import('jest').Config} */
const config = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    // Pick up .test.js files anywhere in the project
    testMatch: ['**/tests/**/*.test.js'],
    // Graceful timeout for slow async ops (MongoMemoryServer, bcrypt)
    testTimeout: 30_000,
    // Verbose output so each individual test result is shown
    verbose: true,
};

module.exports = config;
