require("dotenv").config();

const bcrypt = require("bcryptjs");
const express = require("express");
const cors = require("cors");

const User = require("./models/User");
const Template = require("./models/Template");
const Requirement = require("./models/Requirement");
const Rule = require("./models/Rule");
const authRoutes = require("./routes/auth");
const analystRoutes = require("./routes/analyst");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/analyst", analystRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Маршрут не найден" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Внутренняя ошибка сервера" });
});

async function seedAdminFromEnv() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "System Admin";

  if (!adminEmail || !adminPassword) {
    return;
  }

  const existingAdmin = await User.findByEmail(adminEmail);
  if (existingAdmin) {
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await User.create({
    name: adminName,
    email: adminEmail,
    passwordHash,
    role: "админ",
  });

  console.log(`Admin user created: ${adminEmail}`);
}

async function initialize() {
  await User.createTable();
  await Template.createTable();
  await Requirement.createTable();
  await Rule.createTable();
  await seedAdminFromEnv();

  app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
  });
}

initialize().catch((error) => {
  console.error("Failed to initialize server:", error);
  process.exit(1);
});
