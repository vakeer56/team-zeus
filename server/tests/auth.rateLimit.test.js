/**
 * tests/auth.rateLimit.test.js
 *
 * Tests for rate limiting on /register and /login.
 *
 * ─── IMPORTANT LIMITATION ───────────────────────────────────────────────────
 *
 * The rate limiter instances (loginLimiter, registerLimiter) are created with
 * hardcoded windowMs / max values INSIDE auth.routes.js at module-load time:
 *
 *   const loginLimiter    = rateLimit({ windowMs: 15 * 60 * 1000, max: 8, … })
 *   const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, … })
 *
 * There is currently NO mechanism to inject lower limits for test environments
 * (no config object, no env var, no factory function).
 *
 * CONSEQUENCE: In tests we must hit the real limits:
 *   • 11 registration attempts → the 11th should return 429
 *   • 9  login       attempts → the 9th  should return 429
 *
 * These tests are sequential and send requests in a tight loop, which is fine
 * for CI. However, because the window is 15 min / 1 hour, the limiter's
 * in-memory store will NOT reset between tests unless the Node.js module cache
 * is reset (i.e. a fresh process).  We work around this by:
 *   a) Using unique email addresses per test so each key-generator bucket
 *      starts at zero (loginLimiter keys on IP + email).
 *   b) Running this file in --runInBand mode (single process/thread) so the
 *      store state is predictable.
 *
 * ─── RECOMMENDED REFACTOR (do NOT apply without user approval) ──────────────
 *
 * To make rate limiter config truly testable without relying on real limits,
 * refactor auth.routes.js as follows:
 *
 *   // auth.routes.js
 *   function createRouter({
 *     loginMax     = 8,
 *     loginWindowMs    = 15 * 60 * 1000,
 *     registerMax  = 10,
 *     registerWindowMs = 60 * 60 * 1000,
 *   } = {}) {
 *     const loginLimiter    = rateLimit({ windowMs: loginWindowMs,    max: loginMax,    … });
 *     const registerLimiter = rateLimit({ windowMs: registerWindowMs, max: registerMax, … });
 *     // … rest of router setup …
 *     return router;
 *   }
 *   module.exports = createRouter;
 *
 *   // app.js (production)
 *   app.use(createRouter());
 *
 *   // tests
 *   app.use(createRouter({ loginMax: 3, loginWindowMs: 1000,
 *                          registerMax: 3, registerWindowMs: 1000 }));
 *
 * This allows tests to use low limits without modifying production behaviour.
 * ────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const app = require('../src/app');

// ── Helpers ──────────────────────────────────────────────────────────────────
let emailCounter = 0;
function uniqueEmail() {
    return `ratelimit${++emailCounter}@example.com`;
}

const BASE_PAYLOAD = {
    name: 'Rate Tester',
    password: 'safePassword99',
};

// ── Register rate-limit test ──────────────────────────────────────────────────
describe('Rate limiting – POST /register (max 10 per IP per hour)', () => {
    it('returns 429 after exceeding 10 registration attempts from the same IP', async () => {
        // The limiter keys on req.ip. In supertest requests the IP will be
        // 127.0.0.1 (or ::1) for every request, so they all share the same bucket.
        //
        // We send 11 requests. The first 10 must succeed or fail with non-429
        // status codes (a 400 is fine – e.g. duplicate email on the 2nd attempt
        // with the same address). The 11th must be 429.

        const email = uniqueEmail(); // same email = duplicate error after first
        const responses = [];

        for (let i = 0; i < 11; i++) {
            const res = await request(app)
                .post('/register')
                .send({ ...BASE_PAYLOAD, email: i === 0 ? email : uniqueEmail() });
            responses.push(res.status);
        }

        const lastStatus = responses[responses.length - 1];
        expect(lastStatus).toBe(429);
    }, 30_000); // generous timeout – 11 bcrypt hashes take time
});

// ── Login rate-limit test ─────────────────────────────────────────────────────
describe('Rate limiting – POST /login (max 8 per IP+email per 15 min)', () => {
    it('returns 429 after exceeding 8 login attempts for the same IP+email', async () => {
        // Register a user so the login path actually reaches the limiter
        // (the limiter is checked BEFORE the controller, so even failed
        // logins count toward the limit)
        const email = uniqueEmail();

        await request(app)
            .post('/register')
            .send({ ...BASE_PAYLOAD, email });

        // Send 9 login attempts with the same IP+email key.
        // Attempts 1-8 may return 200 or 401 (depending on the password);
        // attempt 9 must return 429.
        const responses = [];
        for (let i = 0; i < 9; i++) {
            const res = await request(app)
                .post('/login')
                .send({ email, password: 'wrongPassword99' }); // always wrong
            responses.push(res.status);
        }

        // Verify 429 was eventually returned
        expect(responses).toContain(429);

        // Specifically the LAST response should be 429 (limit is 8; 9th is blocked)
        expect(responses[responses.length - 1]).toBe(429);
    }, 20_000);

    it('returns 429 with the configured message body', async () => {
        // Use a fresh email to get a fresh bucket, then exhaust it
        const email = uniqueEmail();

        await request(app)
            .post('/register')
            .send({ ...BASE_PAYLOAD, email });

        let lastRes;
        for (let i = 0; i < 9; i++) {
            lastRes = await request(app)
                .post('/login')
                .send({ email, password: 'badPassword99' });
        }

        expect(lastRes.status).toBe(429);
        expect(lastRes.body).toMatchObject({
            success: false,
            message: expect.stringMatching(/too many login attempts/i),
        });
    }, 20_000);
});
