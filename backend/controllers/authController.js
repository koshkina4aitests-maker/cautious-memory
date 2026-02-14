const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

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
  return role === "аналитик" || role === "админ";
}

async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email и password обязательны" });
    }

    const safeRole = role || "аналитик";
    if (!validateRole(safeRole)) {
      return res.status(400).json({ message: "Некорректная роль пользователя" });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "Пользователь с таким email уже существует" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const createdUser = await User.create({
      name,
      email,
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
    if (!email || !password) {
      return res.status(400).json({ message: "email и password обязательны" });
    }

    const user = await User.findByEmail(email);
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
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

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
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
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
};
