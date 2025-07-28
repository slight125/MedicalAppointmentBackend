import dotenv from "dotenv";
import jwt from "jsonwebtoken";

// Load environment variables from .env file
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("JWT_SECRET is not defined in your .env file.");
  process.exit(1);
}

// Example payload (customize as needed)
const payload = {
  userId: 1,
  email: "user@example.com",
  role: "user"
};

// Generate JWT
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

console.log("Generated JWT:\n", token); 