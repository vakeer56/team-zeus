const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../src/models/user.model');
const Assessment = require('../src/models/assessment.model');

const buildAssessmentPayload = (overrides = {}) => ({
    title: 'Sample Assessment',
    description: 'A test assessment',
    duration: 45,
    difficulty: 'medium',
    status: 'published',
    questions: [
        {
            question: 'What is 2 + 2?',
            type: 'MCQ',
            marks: 5,
            options: ['3', '4', '5', '6'],
            correctOptionIndex: 1,
        },
    ],
    ...overrides,
});

async function createUser(overrides = {}) {
    const email = overrides.email || `user-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
    const password = overrides.password || 'StrongPassword123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name: overrides.name || 'Test User',
        email,
        password: hashedPassword,
        role: overrides.role || 'candidate',
        isVerified: overrides.isVerified ?? true,
    });

    return user;
}

async function createAdmin(overrides = {}) {
    return createUser({ ...overrides, role: 'admin' });
}

async function createCandidate(overrides = {}) {
    return createUser({ ...overrides, role: 'candidate' });
}

function generateJWT(user) {
    return jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });
}

function authHeader(token) {
    return { Authorization: `Bearer ${token}` };
}

async function createAssessment(overrides = {}, createdBy) {
    const payload = buildAssessmentPayload(overrides);
    return Assessment.create({
        ...payload,
        createdBy: createdBy || (await createAdmin())._id,
    });
}

module.exports = {
    buildAssessmentPayload,
    createUser,
    createAdmin,
    createCandidate,
    generateJWT,
    authHeader,
    createAssessment,
};
