import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";
import { users } from "../models/schema";
import { transporter } from "../utils/mailer";

export const registerUser = async (req: Request, res: Response) => {
  const { firstname, lastname, email, password, contact_phone, address } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: "User with this email already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the database
    const [newUser] = await db.insert(users).values({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      contact_phone,
      address,
      role: "user",
    }).returning();

    // Send welcome email
    if (newUser.email) {
      await transporter.sendMail({
        from: `"Teach2Give Welcome" <${process.env.EMAIL_USER}>`,
        to: newUser.email,
        subject: "Welcome to Teach2Give 👋",
        html: `
          <h2>Hi ${newUser.firstname || "there"}!</h2>
          <p>Your account has been created successfully. You can now log in and book appointments with ease.</p>
          <p>Thank you for joining our healthcare journey!</p>
        `
      });
    }

    res.status(201).json({ message: "User registered successfully 🚀" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed due to a server error." });
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required." });

  try {
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user[0]) return res.status(401).json({ message: "Invalid email or password." });

    const passwordMatch = await bcrypt.compare(password, user[0].password ?? "");
    if (!passwordMatch) return res.status(401).json({ message: "Invalid email or password." });

    const token = jwt.sign(
      {
        user_id: user[0].user_id,
        email: user[0].email,
        role: user[0].role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "2h" }
    );

    res.status(200).json({ message: "Login successful 🎉", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed due to a server error." });
  }
};
