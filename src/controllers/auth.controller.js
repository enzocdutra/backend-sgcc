import db from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const result = await db.query(
      "INSERT INTO users (name, email, password) VALUES ($1,$2,$3) RETURNING id",
      [name, email, hashed]
    );

    res.json({ message: "User created", userId: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ error: "User not found" });

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id }, "secret_key", { expiresIn: "1d" });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
