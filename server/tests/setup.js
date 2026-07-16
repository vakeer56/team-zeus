/**
 * tests/setup.js
 *
 * Global Jest setup / teardown for the in-memory MongoDB lifecycle.
 *
 * How it works
 * ────────────
 * • beforeAll  – start MongoMemoryServer, connect Mongoose
 * • afterEach  – wipe every collection (clean slate per test)
 * • afterAll   – disconnect Mongoose, stop MongoMemoryServer
 *
 * JWT_SECRET is set inline so the suite never reads the real .env.
 * Do NOT import dotenv here; we want full isolation.
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// ── Test-only environment variables ─────────────────────────────────────────
process.env.JWT_SECRET = 'test-super-secret-jwt-key-for-tests-only';
process.env.NODE_ENV = 'test';
// ────────────────────────────────────────────────────────────────────────────

let mongod;

/**
 * Start the in-memory server and open a Mongoose connection.
 * Runs once per Jest worker before any test in the file.
 */
beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
});

/**
 * Drop every collection between tests so each test starts with a
 * completely empty database, preventing ordering dependencies.
 */
afterEach(async () => {
    const collections = mongoose.connection.collections;
    await Promise.all(
        Object.values(collections).map((col) => col.deleteMany({}))
    );
});

/**
 * Tear down Mongoose + MongoMemoryServer after all tests in the file.
 */
afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
});
