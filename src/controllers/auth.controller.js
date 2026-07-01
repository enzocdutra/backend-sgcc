import { db } from "../db.js";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

function toSessionUser(user) {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role || "admin"
  };
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await db.query(
      "INSERT INTO users (name, email, password) VALUES ($1,$2,$3) RETURNING id, name, email",
      [name.trim(), email.trim().toLowerCase(), hashed]
    );

    const user = toSessionUser(result.rows[0]);
    const accessToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1d" });

    res.json({ message: "User created", userId: user.id, accessToken, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function login(req, res) {
  try {
    const email = req.body.email || req.body.username;
    const password = req.body.password || req.body.senha;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: "Invalid email or password" });

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });

    const sessionUser = toSessionUser(user);
    const accessToken = jwt.sign({ id: sessionUser.id }, JWT_SECRET, { expiresIn: "1d" });

    res.json({ accessToken, token: accessToken, user: sessionUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function me(req, res) {
  try {
    const result = await db.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(toSessionUser(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
