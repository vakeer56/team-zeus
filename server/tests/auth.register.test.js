/**
 * tests/auth.register.test.js
 *
 * Tests for POST /register
 *
 * Covered cases:
 *  1. Successful registration → 201, token, user object (no password)
 *  2. Duplicate email → 400 "Email already registered"
 *  3. Invalid email format → 400 (Zod validation)
 *  4. Password too short (< 8 chars) → 400
 *  5. Name too short (< 2 chars) → 400
 *  6. Privilege escalation: role:"admin" in body → stored & returned as "candidate"
 *  7. Email normalisation: padded / mixed-case → stored lowercase & trimmed
 *  8. verificationToken generated, isVerified = false on created user
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user.model');

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
const VALID_PAYLOAD = {
    name: 'Alice Tester',
    email: 'alice@example.com',
    password: 'securePassword123',
};

async function registerUser(payload = VALID_PAYLOAD) {
    return request(app).post('/register').send(payload);
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────
describe('POST /register', () => {
    // ── 1. Happy path ───────────────────────────────────────────────────────
    it('returns 201, a JWT token and a user object without the password field', async () => {
        const res = await registerUser();

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);

        // Token must be a non-empty string
        expect(typeof res.body.token).toBe('string');
        expect(res.body.token.length).toBeGreaterThan(0);

        // User object is present
        const { user } = res.body;
        expect(user).toBeDefined();
        expect(user.id).toBeDefined();
        expect(user.name).toBe(VALID_PAYLOAD.name);
        expect(user.email).toBe(VALID_PAYLOAD.email.toLowerCase());
        expect(user.role).toBe('candidate');

        // password must NOT appear anywhere in the response body
        expect(JSON.stringify(res.body)).not.toMatch(/password/i);
    });

    // ── 2. Duplicate email ──────────────────────────────────────────────────
    it('returns 400 when the same email is registered twice', async () => {
        await registerUser(); // first registration succeeds
        const res = await registerUser(); // second must fail

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/email already registered/i);
    });

    // ── 3. Invalid email format ─────────────────────────────────────────────
    it('returns 400 for an invalid email format', async () => {
        const res = await registerUser({ ...VALID_PAYLOAD, email: 'not-an-email' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    // ── 4. Password too short ───────────────────────────────────────────────
    it('returns 400 when password is shorter than 8 characters', async () => {
        const res = await registerUser({ ...VALID_PAYLOAD, password: 'short' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/password must be at least 8 characters/i);
    });

    // ── 5. Name too short ───────────────────────────────────────────────────
    it('returns 400 when name is shorter than 2 characters', async () => {
        const res = await registerUser({ ...VALID_PAYLOAD, name: 'A' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/name must be at least 2 characters/i);
    });

    // ── 6. Privilege escalation ─────────────────────────────────────────────
    it('always stores role as "candidate" even when body sends role:"admin"', async () => {
        // role is not part of the Zod schema, so it's stripped silently.
        // The controller hard-codes role: "candidate" in User.create(…).
        const res = await registerUser({ ...VALID_PAYLOAD, role: 'admin' });

        expect(res.status).toBe(201);

        // Response body must say "candidate"
        expect(res.body.user.role).toBe('candidate');

        // DB record must also say "candidate"
        const dbUser = await User.findOne({ email: VALID_PAYLOAD.email });
        expect(dbUser.role).toBe('candidate');
    });

    // ── 7. Email normalisation ──────────────────────────────────────────────
    it('stores email lowercased and trimmed even when submitted with mixed case and spaces', async () => {
        const res = await registerUser({
            ...VALID_PAYLOAD,
            email: '  User@Example.COM  ',
        });

        expect(res.status).toBe(201);
        expect(res.body.user.email).toBe('user@example.com');

        const dbUser = await User.findOne({ email: 'user@example.com' });
        expect(dbUser).not.toBeNull();
        expect(dbUser.email).toBe('user@example.com');
    });

    // ── 8. verificationToken generated, isVerified = false ─────────────────
    it('creates the user with isVerified=false and a non-null verificationToken', async () => {
        await registerUser();

        // We must go directly to the DB because the API response intentionally
        // omits verificationToken and isVerified.
        const dbUser = await User.findOne({ email: VALID_PAYLOAD.email });
        expect(dbUser).not.toBeNull();
        expect(dbUser.isVerified).toBe(false);
        expect(typeof dbUser.verificationToken).toBe('string');
        expect(dbUser.verificationToken.length).toBeGreaterThan(0);
    });
});
