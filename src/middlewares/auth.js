import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token not provided" });

  jwt.verify(token, "secret_key", (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });

    req.userId = decoded.id;
    next();
  });
}
