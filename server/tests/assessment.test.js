const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const Assessment = require('../src/models/assessment.model');
const {
    buildAssessmentPayload,
    createAdmin,
    createCandidate,
    generateJWT,
    authHeader,
    createAssessment,
} = require('./testUtils');

describe('Assessment module', () => {
    beforeEach(async () => {
        await Assessment.deleteMany({});
    });

    describe('POST /assessments', () => {
        it('allows an admin to create an assessment', async () => {
            const admin = await createAdmin();
            const token = generateJWT(admin);

            const res = await request(app)
                .post('/assessments')
                .set(authHeader(token))
                .send(buildAssessmentPayload());

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe('Sample Assessment');
            expect(res.body.data.createdBy).toBeUndefined();
            expect(await Assessment.countDocuments()).toBe(1);
        });

        it('returns 403 for a candidate creating an assessment', async () => {
            const candidate = await createCandidate();
            const token = generateJWT(candidate);

            const res = await request(app)
                .post('/assessments')
                .set(authHeader(token))
                .send(buildAssessmentPayload());

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('returns 401 for an unauthenticated user', async () => {
            const res = await request(app).post('/assessments').send(buildAssessmentPayload());
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('returns 400 for an invalid body', async () => {
            const admin = await createAdmin();
            const token = generateJWT(admin);

            const res = await request(app)
                .post('/assessments')
                .set(authHeader(token))
                .send({ title: 'Bad' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('rejects unknown fields with a strict schema error', async () => {
            const admin = await createAdmin();
            const token = generateJWT(admin);

            const res = await request(app)
                .post('/assessments')
                .set(authHeader(token))
                .send({ ...buildAssessmentPayload(), createdBy: 'not-an-object-id' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'createdBy' })]));
        });

        it('returns 400 when required fields are missing', async () => {
            const admin = await createAdmin();
            const token = generateJWT(admin);

            const res = await request(app)
                .post('/assessments')
                .set(authHeader(token))
                .send({ title: 'Missing fields' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('rejects invalid question types', async () => {
            const admin = await createAdmin();
            const token = generateJWT(admin);

            const payload = buildAssessmentPayload({
                questions: [{
                    question: 'Example',
                    type: 'OTHER',
                    marks: 1,
                }],
            });

            const res = await request(app)
                .post('/assessments')
                .set(authHeader(token))
                .send(payload);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('rejects invalid MCQ schema', async () => {
            const admin = await createAdmin();
            const token = generateJWT(admin);

            const payload = buildAssessmentPayload({
                questions: [{
                    question: 'Which is correct?',
                    type: 'MCQ',
                    marks: 3,
                    options: ['Only one option'],
                }],
            });

            const res = await request(app)
                .post('/assessments')
                .set(authHeader(token))
                .send(payload);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('rejects invalid CODE schema', async () => {
            const admin = await createAdmin();
            const token = generateJWT(admin);

            const payload = buildAssessmentPayload({
                questions: [{
                    question: 'Write code',
                    type: 'CODE',
                    marks: 3,
                    sampleTestCases: [{ input: '1', expectedOutput: '2' }],
                }],
            });

            const res = await request(app)
                .post('/assessments')
                .set(authHeader(token))
                .send(payload);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /assessments', () => {
        it('returns full assessments to admins', async () => {
            const admin = await createAdmin();
            const token = generateJWT(admin);
            await createAssessment({ status: 'published' }, admin._id);

            const res = await request(app)
                .get('/assessments')
                .set(authHeader(token));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data[0].questions[0].correctOptionIndex).toBeDefined();
        });

        it('returns sanitized assessments to candidates', async () => {
            const candidate = await createCandidate();
            const token = generateJWT(candidate);
            await createAssessment({ status: 'published' }, (await createAdmin())._id);

            const res = await request(app)
                .get('/assessments')
                .set(authHeader(token));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data[0].correctOptionIndex).toBeUndefined();
            expect(res.body.data[0].hiddenTestCases).toBeUndefined();
            expect(res.body.data[0].createdBy).toBeUndefined();
        });

        it('only returns published assessments to candidates', async () => {
            const candidate = await createCandidate();
            const token = generateJWT(candidate);
            await createAssessment({ status: 'draft' }, (await createAdmin())._id);
            await createAssessment({ status: 'published' }, (await createAdmin())._id);

            const res = await request(app)
                .get('/assessments')
                .set(authHeader(token));

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].status).toBe('published');
        });

        it('requires authentication', async () => {
            const res = await request(app).get('/assessments');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /assessments/:id', () => {
        it('returns full data to admins', async () => {
            const admin = await createAdmin();
            const token = generateJWT(admin);
            const assessment = await createAssessment({ status: 'published' }, admin._id);

            const res = await request(app)
                .get(`/assessments/${assessment._id}`)
                .set(authHeader(token));

            expect(res.status).toBe(200);
            expect(res.body.data.title).toBe('Sample Assessment');
            expect(res.body.data.questions[0].correctOptionIndex).toBe(1);
        });

        it('returns sanitized data to candidates', async () => {
            const candidate = await createCandidate();
            const token = generateJWT(candidate);
            const assessment = await createAssessment({ status: 'published' }, (await createAdmin())._id);

            const res = await request(app)
                .get(`/assessments/${assessment._id}`)
                .set(authHeader(token));

            expect(res.status).toBe(200);
            expect(res.body.data.questions[0].correctOptionIndex).toBeUndefined();
            expect(res.body.data.questions[0].hiddenTestCases).toBeUndefined();
            expect(res.body.data.createdBy).toBeUndefined();
        });

        it('returns 400 for an invalid ObjectId', async () => {
            const candidate = await createCandidate();
            const token = generateJWT(candidate);

            const res = await request(app)
                .get('/assessments/not-a-valid-id')
                .set(authHeader(token));

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('returns 404 for a missing assessment', async () => {
            const candidate = await createCandidate();
            const token = generateJWT(candidate);
            const id = '507f1f77bcf86cd799439011';

            const res = await request(app)
                .get(`/assessments/${id}`)
                .set(authHeader(token));

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('returns 404 for a draft assessment to candidates', async () => {
            const candidate = await createCandidate();
            const token = generateJWT(candidate);
            const assessment = await createAssessment({ status: 'draft' }, (await createAdmin())._id);

            const res = await request(app)
                .get(`/assessments/${assessment._id}`)
                .set(authHeader(token));

            expect(res.status).toBe(404);
        });

        it('returns 404 for an archived assessment to candidates', async () => {
            const candidate = await createCandidate();
            const token = generateJWT(candidate);
            const assessment = await createAssessment({ status: 'archived' }, (await createAdmin())._id);

            const res = await request(app)
                .get(`/assessments/${assessment._id}`)
                .set(authHeader(token));

            expect(res.status).toBe(404);
        });
    });

    describe('PUT /assessments/:id', () => {
        it('allows an admin to update allowed fields', async () => {
            const admin = await createAdmin();
            const token = generateJWT(admin);
            const assessment = await createAssessment({ status: 'draft' }, admin._id);

            const res = await request(app)
                .put(`/assessments/${assessment._id}`)
                .set(authHeader(token))
                .send({ title: 'Updated title', status: 'published' });

            expect(res.status).toBe(200);
            expect(res.body.data.title).toBe('Updated title');
            expect(res.body.data.status).toBe('published');
        });

        it('returns 403 for a candidate updating an assessment', async () => {
            const candidate = await createCandidate();
            const token = generateJWT(candidate);
            const assessment = await createAssessment({ status: 'draft' }, (await createAdmin())._id);

            const res = await request(app)
                .put(`/assessments/${assessment._id}`)
                .set(authHeader(token))
                .send({ title: 'Updated title' });

            expect(res.status).toBe(403);
        });

        it('returns 400 for an invalid ObjectId', async () => {
            const admin = await createAdmin();
            const token = generateJWT(admin);

            const res = await request(app)
                .put('/assessments/not-a-valid-id')
                .set(authHeader(token))
                .send({ title: 'Updated title' });

            expect(res.status).toBe(400);
        });

        it('returns 404 for a missing assessment', async () => {
            const admin = await createAdmin();
            const token = generateJWT(admin);
            const id = '507f1f77bcf86cd799439011';

            const res = await request(app)
                .put(`/assessments/${id}`)
                .set(authHeader(token))
                .send({ title: 'Updated title' });

            expect(res.status).toBe(404);
        });

        it('rejects unknown fields on update', async () => {
            const admin = await createAdmin();
            const token = generateJWT(admin);
            const assessment = await createAssessment({ status: 'draft' }, admin._id);

            const res = await request(app)
                .put(`/assessments/${assessment._id}`)
                .set(authHeader(token))
                .send({ __v: 99 });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('rejects attempts to modify protected fields', async () => {
            const admin = await createAdmin();
            const token = generateJWT(admin);
            const assessment = await createAssessment({ status: 'draft' }, admin._id);

            const res = await request(app)
                .put(`/assessments/${assessment._id}`)
                .set(authHeader(token))
                .send({ _id: '507f1f77bcf86cd799439012', createdBy: '507f1f77bcf86cd799439013', __v: 99, timestamps: 'bad' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('returns 400 for validation errors', async () => {
            const admin = await createAdmin();
            const token = generateJWT(admin);
            const assessment = await createAssessment({ status: 'draft' }, admin._id);

            const res = await request(app)
                .put(`/assessments/${assessment._id}`)
                .set(authHeader(token))
                .send({ duration: 0 });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('DELETE /assessments/:id', () => {
        it('allows an admin to delete an assessment', async () => {
            const admin = await createAdmin();
            const token = generateJWT(admin);
            const assessment = await createAssessment({ status: 'published' }, admin._id);

            const res = await request(app)
                .delete(`/assessments/${assessment._id}`)
                .set(authHeader(token));

            expect(res.status).toBe(204);
            expect(await Assessment.countDocuments()).toBe(0);
        });

        it('returns 403 for a candidate deleting an assessment', async () => {
            const candidate = await createCandidate();
            const token = generateJWT(candidate);
            const assessment = await createAssessment({ status: 'published' }, (await createAdmin())._id);

            const res = await request(app)
                .delete(`/assessments/${assessment._id}`)
                .set(authHeader(token));

            expect(res.status).toBe(403);
        });

        it('returns 400 for an invalid ObjectId', async () => {
            const admin = await createAdmin();
            const token = generateJWT(admin);

            const res = await request(app)
                .delete('/assessments/not-a-valid-id')
                .set(authHeader(token));

            expect(res.status).toBe(400);
        });

        it('returns 404 for a missing assessment', async () => {
            const admin = await createAdmin();
            const token = generateJWT(admin);
            const id = '507f1f77bcf86cd799439011';

            const res = await request(app)
                .delete(`/assessments/${id}`)
                .set(authHeader(token));

            expect(res.status).toBe(404);
        });
    });

    describe('Security tests', () => {
        it('rejects mass assignment attempts', async () => {
            const admin = await createAdmin();
            const token = generateJWT(admin);

            const res = await request(app)
                .post('/assessments')
                .set(authHeader(token))
                .send({
                    ...buildAssessmentPayload(),
                    _id: '507f1f77bcf86cd799439012',
                    createdBy: '507f1f77bcf86cd799439013',
                    __v: 99,
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('never exposes sensitive fields to candidates', async () => {
            const candidate = await createCandidate();
            const token = generateJWT(candidate);
            const assessment = await createAssessment({
                status: 'published',
                questions: [{
                    question: 'Solve this',
                    type: 'CODE',
                    marks: 2,
                    language: 'python',
                    starterCode: 'print(1)',
                    sampleTestCases: [{ input: '1', expectedOutput: '2' }],
                    hiddenTestCases: [{ input: '2', expectedOutput: '3' }],
                    correctOptionIndex: 0,
                }],
            }, (await createAdmin())._id);

            const res = await request(app)
                .get(`/assessments/${assessment._id}`)
                .set(authHeader(token));

            const bodyText = JSON.stringify(res.body);
            expect(res.status).toBe(200);
            expect(bodyText).not.toContain('correctOptionIndex');
            expect(bodyText).not.toContain('hiddenTestCases');
            expect(bodyText).not.toContain('createdBy');
            expect(bodyText).not.toContain('__v');
        });

        it('rejects missing or invalid JWTs', async () => {
            const res1 = await request(app).get('/assessments');
            expect(res1.status).toBe(401);

            const res2 = await request(app)
                .get('/assessments')
                .set(authHeader('invalid-token'));
            expect(res2.status).toBe(401);

            const expiredToken = jwt.sign({ id: '123', role: 'candidate' }, process.env.JWT_SECRET, { expiresIn: '-1s' });
            const res3 = await request(app)
                .get('/assessments')
                .set(authHeader(expiredToken));
            expect(res3.status).toBe(401);
        });
    });
});
