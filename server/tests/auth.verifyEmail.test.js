/**
 * tests/auth.verifyEmail.test.js
 *
 * Tests for GET /verify-email/:token
 *
 * Covered cases:
 *  1. Valid token → 200, isVerified=true, verificationToken cleared in DB
 *  2. Invalid/nonexistent token → 400
 *  3. Token reuse → second call fails (token is cleared after first use)
 */

const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
const REGISTER_PAYLOAD = {
    name: 'Carol Tester',
    email: 'carol@example.com',
    password: 'securePassword123',
};

/** Register a fresh user and return its verificationToken from the DB. */
async function registerAndGetToken() {
    await request(app).post('/register').send(REGISTER_PAYLOAD);
    const user = await User.findOne({ email: REGISTER_PAYLOAD.email });
    return { user, token: user.verificationToken };
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────
describe('GET /verify-email/:token', () => {
    // ── 1. Valid token ──────────────────────────────────────────────────────
    it('returns 200 and marks the user as verified, clearing verificationToken', async () => {
        const { user: beforeUser, token } = await registerAndGetToken();

        expect(beforeUser.isVerified).toBe(false);
        expect(token).not.toBeNull();

        const res = await request(app).get(`/verify-email/${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/verified/i);

        // Confirm DB state changed
        const afterUser = await User.findById(beforeUser._id);
        expect(afterUser.isVerified).toBe(true);
        expect(afterUser.verificationToken).toBeNull();
    });

    // ── 2. Invalid / nonexistent token → 400 ───────────────────────────────
    it('returns 400 for an invalid or nonexistent token', async () => {
        const res = await request(app).get('/verify-email/completely-fake-token-xyz');

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/invalid or expired/i);
    });

    // ── 3. Token reuse → second call fails ─────────────────────────────────
    //
    // After the first successful verification, verificationToken is set to
    // null in the DB. A second attempt with the same token must fail with 400.
    //
    it('rejects a verification token the second time it is used', async () => {
        const { token } = await registerAndGetToken();

        // First use: should succeed
        const firstRes = await request(app).get(`/verify-email/${token}`);
        expect(firstRes.status).toBe(200);

        // Second use with the same token: should fail
        const secondRes = await request(app).get(`/verify-email/${token}`);
        expect(secondRes.status).toBe(400);
        expect(secondRes.body.success).toBe(false);
        expect(secondRes.body.message).toMatch(/invalid or expired/i);
    });
});
