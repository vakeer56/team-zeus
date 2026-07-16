const request = require('supertest');
const app = require('../src/app');
const Submission = require('../src/models/submission.model');
const { ProctorEvent } = require('../src/models/proctorEvent.model');
const {
    createAdmin,
    createCandidate,
    generateJWT,
    authHeader,
    createAssessment,
    createUser,
} = require('./testUtils');

// Mock the AI report service to avoid external API calls during tests
jest.mock('../src/services/aiReport.service', () => ({
    generateAiReport: jest.fn().mockResolvedValue({
        riskScore: 42,
        flags: [
            { type: 'tab_switch', count: 3, severity: 'low' },
            { type: 'suspicious_activity', count: 1, severity: 'medium' },
        ],
        generatedAt: new Date(),
    }),
}));

describe('Proctor Event and AI Report APIs', () => {
    let candidate;
    let otherCandidate;
    let recruiter;
    let admin;
    let assessment;
    let submission;

    beforeEach(async () => {
        // Clean up database collections
        await Submission.deleteMany({});
        await ProctorEvent.deleteMany({});

        // Create test users
        candidate = await createCandidate();
        otherCandidate = await createCandidate();
        recruiter = await createUser({ role: 'recruiter' });
        admin = await createAdmin();

        // Create a test assessment
        assessment = await createAssessment({}, admin._id);

        // Create a submission for candidate
        submission = await Submission.create({
            candidateId: candidate._id,
            assessmentId: assessment._id,
            status: 'in_progress',
        });
    });

    describe('POST /proctor/submissions/:id/proctor-event', () => {
        it('allows the candidate who owns the submission to record a proctor event', async () => {
            const token = generateJWT(candidate);
            const res = await request(app)
                .post(`/proctor/submissions/${submission._id}/proctor-event`)
                .set(authHeader(token))
                .send({
                    eventType: 'tab_switch',
                    metadata: { reason: 'alt-tab' },
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Proctor event recorded');

            const event = await ProctorEvent.findOne({ submissionId: submission._id });
            expect(event).toBeDefined();
            expect(event.eventType).toBe('tab_switch');
            expect(event.candidateId.toString()).toBe(candidate._id.toString());
        });

        it('returns 403 if a different candidate tries to record a proctor event', async () => {
            const token = generateJWT(otherCandidate);
            const res = await request(app)
                .post(`/proctor/submissions/${submission._id}/proctor-event`)
                .set(authHeader(token))
                .send({
                    eventType: 'tab_switch',
                });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Forbidden');
        });

        it('returns 400 for an invalid event type', async () => {
            const token = generateJWT(candidate);
            const res = await request(app)
                .post(`/proctor/submissions/${submission._id}/proctor-event`)
                .set(authHeader(token))
                .send({
                    eventType: 'invalid_event_type_here',
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('returns 404 for a non-existent submission', async () => {
            const token = generateJWT(candidate);
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .post(`/proctor/submissions/${fakeId}/proctor-event`)
                .set(authHeader(token))
                .send({
                    eventType: 'tab_switch',
                });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Submission not found');
        });
    });

    describe('AI Report Generation & Retrieval', () => {
        beforeEach(async () => {
            // Seed a few proctor events first
            await ProctorEvent.create({
                submissionId: submission._id,
                candidateId: candidate._id,
                eventType: 'tab_switch',
            });
            await ProctorEvent.create({
                submissionId: submission._id,
                candidateId: candidate._id,
                eventType: 'suspicious_activity',
            });
        });

        describe('POST /submissions/:id/ai-report/generate (or POST /reports/submissions/:id/generate)', () => {
            it('allows admin to generate an AI report', async () => {
                const token = generateJWT(admin);
                const res = await request(app)
                    .post(`/submissions/${submission._id}/ai-report/generate`)
                    .set(authHeader(token));

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
                expect(res.body.aiReport.riskScore).toBe(42);
                expect(res.body.aiReport.flags).toHaveLength(2);

                const updatedSubmission = await Submission.findById(submission._id);
                expect(updatedSubmission.aiReport.riskScore).toBe(42);
            });

            it('allows recruiter to generate an AI report', async () => {
                const token = generateJWT(recruiter);
                const res = await request(app)
                    .post(`/reports/submissions/${submission._id}/generate`)
                    .set(authHeader(token));

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
                expect(res.body.aiReport.riskScore).toBe(42);
            });

            it('returns 403 when a candidate tries to generate an AI report', async () => {
                const token = generateJWT(candidate);
                const res = await request(app)
                    .post(`/submissions/${submission._id}/ai-report/generate`)
                    .set(authHeader(token));

                expect(res.status).toBe(403);
                expect(res.body.success).toBe(false);
            });
        });

        describe('GET /submissions/:id/ai-report (or GET /reports/submissions/:id)', () => {
            beforeEach(async () => {
                // Pre-populate AI report on the submission
                submission.aiReport = {
                    riskScore: 75,
                    flags: [{ type: 'fullscreen_exit', count: 1, severity: 'high' }],
                    generatedAt: new Date(),
                };
                await submission.save();
            });

            it('allows admin to retrieve the AI report', async () => {
                const token = generateJWT(admin);
                const res = await request(app)
                    .get(`/submissions/${submission._id}/ai-report`)
                    .set(authHeader(token));

                expect(res.status).toBe(200);
                expect(res.body.submissionId.toString()).toBe(submission._id.toString());
                expect(res.body.aiReport.riskScore).toBe(75);
            });

            it('allows recruiter to retrieve the AI report via alternative reports path', async () => {
                const token = generateJWT(recruiter);
                const res = await request(app)
                    .get(`/reports/submissions/${submission._id}`)
                    .set(authHeader(token));

                expect(res.status).toBe(200);
                expect(res.body.submissionId.toString()).toBe(submission._id.toString());
                expect(res.body.aiReport.riskScore).toBe(75);
            });

            it('returns 403 when a candidate tries to retrieve the AI report', async () => {
                const token = generateJWT(candidate);
                const res = await request(app)
                    .get(`/submissions/${submission._id}/ai-report`)
                    .set(authHeader(token));

                expect(res.status).toBe(403);
                expect(res.body.success).toBe(false);
            });
        });
    });
});
