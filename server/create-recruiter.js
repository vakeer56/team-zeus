require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, default: 'candidate' },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String }
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function run() {
  const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/Evalix-dev';
  console.log(`Connecting to MongoDB at ${dbUrl}...`);
  await mongoose.connect(dbUrl);

  const email = 'admin@recruiter.evalix.com';
  const password = 'Password123';
  const name = 'Admin Recruiter';

  // Check if recruiter already exists
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Recruiter with email ${email} already exists.`);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'recruiter',
    isVerified: true
  });

  console.log('----------------------------------------------------');
  console.log('Recruiter Account Created Successfully!');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log('----------------------------------------------------');

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error creating recruiter:', err);
  process.exit(1);
});
