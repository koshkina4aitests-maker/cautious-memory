const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

const ROLE_ALIASES = {
  "аналитик": "аналитик",
  analyst: "аналитик",
  analytic: "аналитик",
  user: "аналитик",
  "админ": "админ",
  admin: "админ",
  administrator: "админ",
};

function normalizeEmail(email) {
  if (typeof email !== "string") {
    return "";
  }
  return email.trim().toLowerCase();
}

function normalizeRole(role) {
  if (typeof role !== "string") {
    return null;
  }
  const normalizedInput = role.trim().toLowerCase();
  return ROLE_ALIASES[normalizedInput] || null;
}

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function validateRole(role) {
  return normalizeRole(role) !== null;
}

async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: "name, email и password обязательны" });
    }

    const safeRole = normalizeRole(role || "аналитик");
    if (!validateRole(safeRole)) {
      return res.status(400).json({ message: "Некорректная роль пользователя" });
    }

    const existingUser = await User.findByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ message: "Пользователь с таким email уже существует" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const createdUser = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: safeRole,
    });

    const token = createToken(createdUser);
    return res.status(201).json({ token, user: createdUser });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Ошибка регистрации" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "email и password обязательны" });
    }

    const user = await User.findByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ message: "Неверный email или пароль" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Неверный email или пароль" });
    }

    const token = createToken(user);
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return res.status(200).json({ token, user: userResponse });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Ошибка авторизации" });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({ message: "Ошибка получения профиля" });
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const rawHeader = Array.isArray(authHeader) ? authHeader[0] : authHeader || "";
  const bearerMatch = rawHeader.match(/^Bearer\s+(.+)$/i);
  const tokenFromHeader = bearerMatch ? bearerMatch[1] : rawHeader;
  const token =
    (typeof tokenFromHeader === "string" && tokenFromHeader.trim()) ||
    req.headers["x-access-token"] ||
    null;

  if (!token) {
    return res.status(401).json({ message: "Требуется Bearer token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Недействительный или истёкший токен" });
  }
}

function authorizeRoles(...allowedRoles) {
  const normalizedAllowed = allowedRoles.map((role) => normalizeRole(role)).filter(Boolean);

  return (req, res, next) => {
    const currentRole = normalizeRole(req.user?.role);
    if (!currentRole || !normalizedAllowed.includes(currentRole)) {
      return res.status(403).json({ message: "Недостаточно прав доступа" });
    }
    return next();
  };
}

module.exports = {
  register,
  login,
  me,
  authenticateToken,
  authorizeRoles,
  normalizeRole,
};
