/**
 * tests/auth.login.test.js
 *
 * Tests for POST /login
 *
 * Covered cases:
 *  1. Successful login → 200, token, user object (no password)
 *  2. Wrong password → 401 generic "Invalid credentials"
 *  3. Non-existent email → 401 with the SAME generic message (enumeration check)
 *  4. Timing parity: bcrypt.compare is called even when the user does not exist
 *  5. Malformed email → 400
 *  6. Missing password field → 400
 *  7. Case-insensitive email lookup (register lower, login upper → success)
 */

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const User = require('../src/models/user.model');

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
const CREDENTIALS = {
    name: 'Bob Tester',
    email: 'bob@example.com',
    password: 'mySecurePass99',
};

/** Register a user then return the response of a login attempt. */
async function setupAndLogin(loginPayload) {
    // Register first so the user exists
    await request(app).post('/register').send(CREDENTIALS);
    return request(app).post('/login').send(loginPayload);
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────
describe('POST /login', () => {
    // ── 1. Successful login ─────────────────────────────────────────────────
    it('returns 200, a JWT token, and a user object without the password field', async () => {
        const res = await setupAndLogin({
            email: CREDENTIALS.email,
            password: CREDENTIALS.password,
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(typeof res.body.token).toBe('string');
        expect(res.body.token.length).toBeGreaterThan(0);

        const { user } = res.body;
        expect(user).toBeDefined();
        expect(user.email).toBe(CREDENTIALS.email.toLowerCase());

        // password must NOT appear anywhere in the response
        expect(JSON.stringify(res.body)).not.toMatch(/password/i);
    });

    // ── 2. Wrong password ───────────────────────────────────────────────────
    it('returns 401 with a generic message for a wrong password', async () => {
        const res = await setupAndLogin({
            email: CREDENTIALS.email,
            password: 'wrongPassword1',
        });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/invalid credentials/i);
        // Must NOT reveal the reason
        expect(res.body.message).not.toMatch(/wrong password/i);
        expect(res.body.message).not.toMatch(/incorrect/i);
    });

    // ── 3. Non-existent email → same generic message (enumeration check) ────
    it('returns 401 with the same generic message for a non-existent email', async () => {
        // Do NOT register – user doesn't exist
        const res = await request(app).post('/login').send({
            email: 'ghost@example.com',
            password: 'somePassword1',
        });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/invalid credentials/i);
    });

    // ── 4. bcrypt.compare is called even when the user doesn't exist ────────
    //
    // This is the timing-parity check. The controller always calls
    //   bcrypt.compare(password, user ? user.password : DUMMY_HASH)
    // so an attacker cannot distinguish "user not found" from "wrong password"
    // by measuring response time.
    //
    it('calls bcrypt.compare even when the user does not exist (timing-safe path)', async () => {
        const compareSpy = jest.spyOn(bcrypt, 'compare');

        await request(app).post('/login').send({
            email: 'nobody@example.com',
            password: 'somePassword1',
        });

        expect(compareSpy).toHaveBeenCalledTimes(1);
        compareSpy.mockRestore();
    });

    // ── 5. Malformed email → 400 ────────────────────────────────────────────
    it('returns 400 for a malformed email', async () => {
        const res = await request(app).post('/login').send({
            email: 'not-an-email',
            password: 'somePassword1',
        });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    // ── 6. Missing password → 400 ───────────────────────────────────────────
    it('returns 400 when the password field is missing', async () => {
        const res = await request(app).post('/login').send({
            email: CREDENTIALS.email,
            // no password
        });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    // ── 7. Case-insensitive email lookup ────────────────────────────────────
    //
    // Register with lowercase email, login with mixed-case → should succeed.
    // Both the Zod schema and the User model normalise to lowercase, so the
    // lookup must find the same document.
    //
    it('accepts a login when email casing differs from the stored email', async () => {
        // Register with lowercase
        await request(app).post('/register').send({
            ...CREDENTIALS,
            email: 'casetest@example.com',
        });

        // Login with mixed case
        const res = await request(app).post('/login').send({
            email: 'CASETest@Example.COM',
            password: CREDENTIALS.password,
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.email).toBe('casetest@example.com');
    });

    // ── 8. Recruiter login and query scoping ────────────────────────────────
    it('successfully logs in a recruiter and scopes query only to recruiters', async () => {
        const hashedPassword = await bcrypt.hash('recruiterPass123', 10);
        
        // Create a recruiter user
        await User.create({
            name: 'Recruiter Admin',
            email: 'recruiter@recruiter.evalix.com',
            password: hashedPassword,
            role: 'recruiter',
            isVerified: true,
        });

        // Try to login
        const res = await request(app).post('/login').send({
            email: 'recruiter@recruiter.evalix.com',
            password: 'recruiterPass123',
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.role).toBe('recruiter');

        // Create a candidate with the recruiter email structure (for testing query restriction)
        // Note: In real life, they can't self-register, but if one exists, we shouldn't allow it to login as recruiter.
        await User.create({
            name: 'Fake Recruiter',
            email: 'fake@recruiter.evalix.com',
            password: hashedPassword,
            role: 'candidate',
            isVerified: true,
        });

        const loginRes = await request(app).post('/login').send({
            email: 'fake@recruiter.evalix.com',
            password: 'recruiterPass123',
        });

        // Since the email ends with @recruiter.evalix.com, the query looks for role: 'recruiter'.
        // It won't find the candidate record, so it should return 401.
        expect(loginRes.status).toBe(401);
    });
});
