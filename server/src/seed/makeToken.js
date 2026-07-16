// src/seed/makeToken.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

const [, , userId, role] = process.argv;

if (!userId || !role) {
  console.error("Usage: node src/seed/makeToken.js <userId> <role>");
  process.exit(1);
}

const token = jwt.sign(
  { _id: userId, role },
  process.env.JWT_SECRET,
  { expiresIn: "6h" }
);

console.log(token);