const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Template = require("../models/Template");
const Requirement = require("../models/Requirement");
const Rule = require("../models/Rule");
const { normalizeRole } = require("./authController");

function parseId(rawValue) {
  const id = Number(rawValue);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeEmail(email) {
  if (typeof email !== "string") {
    return "";
  }
  return email.trim().toLowerCase();
}

function isValidRole(role) {
  return normalizeRole(role) !== null;
}

// Users CRUD
async function listUsers(req, res) {
  try {
    const users = await User.findAll();
    return res.status(200).json(users);
  } catch (error) {
    console.error("listUsers error:", error);
    return res.status(500).json({ message: "Ошибка получения пользователей" });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = normalizeEmail(email);
    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: "name, email и password обязательны" });
    }
    const safeRole = normalizeRole(role || "аналитик");
    if (!isValidRole(safeRole)) {
      return res.status(400).json({ message: "Некорректная роль" });
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
    return res.status(201).json(createdUser);
  } catch (error) {
    console.error("createUser error:", error);
    return res.status(500).json({ message: "Ошибка создания пользователя" });
  }
}

async function getUser(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный id пользователя" });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("getUser error:", error);
    return res.status(500).json({ message: "Ошибка получения пользователя" });
  }
}

async function updateUser(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный id пользователя" });
    }

    const existingUser = await User.findWithPasswordById(id);
    if (!existingUser) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const payload = {
      name: req.body.name,
      email: req.body.email !== undefined ? normalizeEmail(req.body.email) : undefined,
    };

    if (req.body.role !== undefined) {
      const normalizedRole = normalizeRole(req.body.role);
      if (!isValidRole(normalizedRole)) {
        return res.status(400).json({ message: "Некорректная роль" });
      }
      payload.role = normalizedRole;
    }

    if (req.body.password) {
      payload.passwordHash = await bcrypt.hash(req.body.password, 10);
    }

    const updatedUser = await User.update(id, payload);
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("updateUser error:", error);
    return res.status(500).json({ message: "Ошибка обновления пользователя" });
  }
}

async function deleteUser(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный id пользователя" });
    }
    const deletedUser = await User.delete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    return res.status(200).json(deletedUser);
  } catch (error) {
    console.error("deleteUser error:", error);
    return res.status(500).json({ message: "Ошибка удаления пользователя" });
  }
}

// Templates CRUD
async function listTemplates(req, res) {
  try {
    const templates = await Template.findAll();
    return res.status(200).json(templates);
  } catch (error) {
    console.error("admin listTemplates error:", error);
    return res.status(500).json({ message: "Ошибка получения шаблонов" });
  }
}

async function createTemplate(req, res) {
  try {
    const { name, description, schema, analystId } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Поле name обязательно" });
    }
    const template = await Template.create({
      name,
      description,
      schema,
      analystId: analystId !== undefined ? Number(analystId) : null,
    });
    return res.status(201).json(template);
  } catch (error) {
    console.error("admin createTemplate error:", error);
    return res.status(500).json({ message: "Ошибка создания шаблона" });
  }
}

async function getTemplate(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный id шаблона" });
    }
    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).json({ message: "Шаблон не найден" });
    }
    return res.status(200).json(template);
  } catch (error) {
    console.error("admin getTemplate error:", error);
    return res.status(500).json({ message: "Ошибка получения шаблона" });
  }
}

async function updateTemplate(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный id шаблона" });
    }
    const existingTemplate = await Template.findById(id);
    if (!existingTemplate) {
      return res.status(404).json({ message: "Шаблон не найден" });
    }
    const updatedTemplate = await Template.update(id, {
      name: req.body.name,
      description: req.body.description,
      schema: req.body.schema,
      analystId: req.body.analystId !== undefined ? Number(req.body.analystId) : undefined,
    });
    return res.status(200).json(updatedTemplate);
  } catch (error) {
    console.error("admin updateTemplate error:", error);
    return res.status(500).json({ message: "Ошибка обновления шаблона" });
  }
}

async function deleteTemplate(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный id шаблона" });
    }
    const deletedTemplate = await Template.delete(id);
    if (!deletedTemplate) {
      return res.status(404).json({ message: "Шаблон не найден" });
    }
    return res.status(200).json(deletedTemplate);
  } catch (error) {
    console.error("admin deleteTemplate error:", error);
    return res.status(500).json({ message: "Ошибка удаления шаблона" });
  }
}

// Requirements CRUD
async function listRequirements(req, res) {
  try {
    const requirements = await Requirement.findAll();
    return res.status(200).json(requirements);
  } catch (error) {
    console.error("admin listRequirements error:", error);
    return res.status(500).json({ message: "Ошибка получения требований" });
  }
}

async function createRequirement(req, res) {
  try {
    const { templateId, title, details, status, analystId } = req.body;
    if (!templateId || !title) {
      return res.status(400).json({ message: "templateId и title обязательны" });
    }
    const requirement = await Requirement.create({
      templateId: Number(templateId),
      title,
      details,
      status,
      analystId: analystId !== undefined ? Number(analystId) : null,
    });
    return res.status(201).json(requirement);
  } catch (error) {
    console.error("admin createRequirement error:", error);
    return res.status(500).json({ message: "Ошибка создания требования" });
  }
}

async function getRequirement(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный id требования" });
    }
    const requirement = await Requirement.findById(id);
    if (!requirement) {
      return res.status(404).json({ message: "Требование не найдено" });
    }
    return res.status(200).json(requirement);
  } catch (error) {
    console.error("admin getRequirement error:", error);
    return res.status(500).json({ message: "Ошибка получения требования" });
  }
}

async function updateRequirement(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный id требования" });
    }
    const existingRequirement = await Requirement.findById(id);
    if (!existingRequirement) {
      return res.status(404).json({ message: "Требование не найдено" });
    }
    const updatedRequirement = await Requirement.update(id, {
      templateId: req.body.templateId !== undefined ? Number(req.body.templateId) : undefined,
      title: req.body.title,
      details: req.body.details,
      status: req.body.status,
      analystId: req.body.analystId !== undefined ? Number(req.body.analystId) : undefined,
    });
    return res.status(200).json(updatedRequirement);
  } catch (error) {
    console.error("admin updateRequirement error:", error);
    return res.status(500).json({ message: "Ошибка обновления требования" });
  }
}

async function deleteRequirement(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный id требования" });
    }
    const deletedRequirement = await Requirement.delete(id);
    if (!deletedRequirement) {
      return res.status(404).json({ message: "Требование не найдено" });
    }
    return res.status(200).json(deletedRequirement);
  } catch (error) {
    console.error("admin deleteRequirement error:", error);
    return res.status(500).json({ message: "Ошибка удаления требования" });
  }
}

// Rules CRUD
async function listRules(req, res) {
  try {
    const rules = await Rule.findAll();
    return res.status(200).json(rules);
  } catch (error) {
    console.error("admin listRules error:", error);
    return res.status(500).json({ message: "Ошибка получения правил" });
  }
}

async function createRule(req, res) {
  try {
    const { templateId, name, conditionText, actionText, priority, analystId } = req.body;
    if (!templateId || !name || !conditionText || !actionText) {
      return res
        .status(400)
        .json({ message: "templateId, name, conditionText и actionText обязательны" });
    }

    const rule = await Rule.create({
      templateId: Number(templateId),
      name,
      conditionText,
      actionText,
      priority: priority !== undefined ? Number(priority) : undefined,
      analystId: analystId !== undefined ? Number(analystId) : null,
    });
    return res.status(201).json(rule);
  } catch (error) {
    console.error("admin createRule error:", error);
    return res.status(500).json({ message: "Ошибка создания правила" });
  }
}

async function getRule(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный id правила" });
    }
    const rule = await Rule.findById(id);
    if (!rule) {
      return res.status(404).json({ message: "Правило не найдено" });
    }
    return res.status(200).json(rule);
  } catch (error) {
    console.error("admin getRule error:", error);
    return res.status(500).json({ message: "Ошибка получения правила" });
  }
}

async function updateRule(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный id правила" });
    }
    const existingRule = await Rule.findById(id);
    if (!existingRule) {
      return res.status(404).json({ message: "Правило не найдено" });
    }
    const updatedRule = await Rule.update(id, {
      templateId: req.body.templateId !== undefined ? Number(req.body.templateId) : undefined,
      name: req.body.name,
      conditionText: req.body.conditionText,
      actionText: req.body.actionText,
      priority: req.body.priority !== undefined ? Number(req.body.priority) : undefined,
      analystId: req.body.analystId !== undefined ? Number(req.body.analystId) : undefined,
    });
    return res.status(200).json(updatedRule);
  } catch (error) {
    console.error("admin updateRule error:", error);
    return res.status(500).json({ message: "Ошибка обновления правила" });
  }
}

async function deleteRule(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный id правила" });
    }
    const deletedRule = await Rule.delete(id);
    if (!deletedRule) {
      return res.status(404).json({ message: "Правило не найдено" });
    }
    return res.status(200).json(deletedRule);
  } catch (error) {
    console.error("admin deleteRule error:", error);
    return res.status(500).json({ message: "Ошибка удаления правила" });
  }
}

module.exports = {
  listUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  listTemplates,
  createTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  listRequirements,
  createRequirement,
  getRequirement,
  updateRequirement,
  deleteRequirement,
  listRules,
  createRule,
  getRule,
  updateRule,
  deleteRule,
};
