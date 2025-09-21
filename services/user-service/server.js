import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = process.env.USER_SERVICE_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

app.use(express.json());

// In-memory database (use real database in production)
let users = [
  {
    id: "1",
    email: "john@example.com",
    password: "$2a$10$K5z3PQ2JF3LQ3Q3Q3Q3Q3O", // "password123"
    firstName: "John",
    lastName: "Doe",
    createdAt: new Date().toISOString(),
  },
];

// Register user
app.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user exists
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      firstName,
      lastName,
      createdAt: new Date().toISOString(),
    };

    users.push(user);

    // Remove password from response
    const { password: _, ...userResponse } = user;
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login user
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "24h",
    });

    const { password: _, ...userResponse } = user;
    res.json({ token, user: userResponse });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user profile
app.get("/profile/:id", (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const { password: _, ...userResponse } = user;
  res.json(userResponse);
});

// Health check
app.get("/health", (req, res) => {
  res.json({ service: "user-service", status: "healthy" });
});

app.listen(PORT, () => {
  console.log(`👤 User Service running on port ${PORT}`);
});
