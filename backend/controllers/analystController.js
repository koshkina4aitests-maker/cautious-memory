const Template = require("../models/Template");
const Requirement = require("../models/Requirement");
const Rule = require("../models/Rule");

function parseId(rawValue) {
  const id = Number(rawValue);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function canAccessByOwner(record, user) {
  return user.role === "админ" || record.analyst_id === user.id;
}

async function ensureTemplateAccess(templateId, user) {
  const template = await Template.findById(templateId);
  if (!template) {
    return { error: { status: 404, message: "Шаблон не найден" } };
  }
  if (!canAccessByOwner(template, user)) {
    return { error: { status: 403, message: "Нет доступа к шаблону" } };
  }
  return { template };
}

// Templates
async function listTemplates(req, res) {
  try {
    const templates =
      req.user.role === "админ"
        ? await Template.findAll()
        : await Template.findByAnalyst(req.user.id);
    return res.status(200).json(templates);
  } catch (error) {
    console.error("listTemplates error:", error);
    return res.status(500).json({ message: "Ошибка получения шаблонов" });
  }
}

async function createTemplate(req, res) {
  try {
    const { name, description, schema, analystId } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Поле name обязательно" });
    }

    const ownerId =
      req.user.role === "админ" && analystId !== undefined ? analystId : req.user.id;

    const template = await Template.create({
      name,
      description,
      schema,
      analystId: ownerId,
    });
    return res.status(201).json(template);
  } catch (error) {
    console.error("createTemplate error:", error);
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
    if (!canAccessByOwner(template, req.user)) {
      return res.status(403).json({ message: "Нет доступа к шаблону" });
    }
    return res.status(200).json(template);
  } catch (error) {
    console.error("getTemplate error:", error);
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
    if (!canAccessByOwner(existingTemplate, req.user)) {
      return res.status(403).json({ message: "Нет доступа к шаблону" });
    }

    const payload = {
      name: req.body.name,
      description: req.body.description,
      schema: req.body.schema,
    };
    if (req.user.role === "админ" && req.body.analystId !== undefined) {
      payload.analystId = req.body.analystId;
    }

    const updatedTemplate = await Template.update(id, payload);
    return res.status(200).json(updatedTemplate);
  } catch (error) {
    console.error("updateTemplate error:", error);
    return res.status(500).json({ message: "Ошибка обновления шаблона" });
  }
}

async function deleteTemplate(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный id шаблона" });
    }

    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).json({ message: "Шаблон не найден" });
    }
    if (!canAccessByOwner(template, req.user)) {
      return res.status(403).json({ message: "Нет доступа к шаблону" });
    }

    const deletedTemplate = await Template.delete(id);
    return res.status(200).json(deletedTemplate);
  } catch (error) {
    console.error("deleteTemplate error:", error);
    return res.status(500).json({ message: "Ошибка удаления шаблона" });
  }
}

// Requirements
async function listRequirements(req, res) {
  try {
    const requirements =
      req.user.role === "админ"
        ? await Requirement.findAll()
        : await Requirement.findByAnalyst(req.user.id);
    return res.status(200).json(requirements);
  } catch (error) {
    console.error("listRequirements error:", error);
    return res.status(500).json({ message: "Ошибка получения требований" });
  }
}

async function createRequirement(req, res) {
  try {
    const { templateId, title, details, status, analystId } = req.body;
    if (!templateId || !title) {
      return res.status(400).json({ message: "templateId и title обязательны" });
    }

    const templateAccess = await ensureTemplateAccess(Number(templateId), req.user);
    if (templateAccess.error) {
      return res.status(templateAccess.error.status).json({ message: templateAccess.error.message });
    }

    const ownerId =
      req.user.role === "админ" && analystId !== undefined ? analystId : req.user.id;

    const requirement = await Requirement.create({
      templateId: Number(templateId),
      title,
      details,
      status,
      analystId: ownerId,
    });
    return res.status(201).json(requirement);
  } catch (error) {
    console.error("createRequirement error:", error);
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
    if (!canAccessByOwner(requirement, req.user)) {
      return res.status(403).json({ message: "Нет доступа к требованию" });
    }
    return res.status(200).json(requirement);
  } catch (error) {
    console.error("getRequirement error:", error);
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
    if (!canAccessByOwner(existingRequirement, req.user)) {
      return res.status(403).json({ message: "Нет доступа к требованию" });
    }

    if (req.body.templateId !== undefined) {
      const templateAccess = await ensureTemplateAccess(Number(req.body.templateId), req.user);
      if (templateAccess.error) {
        return res.status(templateAccess.error.status).json({ message: templateAccess.error.message });
      }
    }

    const payload = {
      templateId: req.body.templateId,
      title: req.body.title,
      details: req.body.details,
      status: req.body.status,
    };
    if (req.user.role === "админ" && req.body.analystId !== undefined) {
      payload.analystId = req.body.analystId;
    }

    const updatedRequirement = await Requirement.update(id, payload);
    return res.status(200).json(updatedRequirement);
  } catch (error) {
    console.error("updateRequirement error:", error);
    return res.status(500).json({ message: "Ошибка обновления требования" });
  }
}

async function deleteRequirement(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный id требования" });
    }

    const requirement = await Requirement.findById(id);
    if (!requirement) {
      return res.status(404).json({ message: "Требование не найдено" });
    }
    if (!canAccessByOwner(requirement, req.user)) {
      return res.status(403).json({ message: "Нет доступа к требованию" });
    }

    const deletedRequirement = await Requirement.delete(id);
    return res.status(200).json(deletedRequirement);
  } catch (error) {
    console.error("deleteRequirement error:", error);
    return res.status(500).json({ message: "Ошибка удаления требования" });
  }
}

// Rules
async function listRules(req, res) {
  try {
    const rules = req.user.role === "админ" ? await Rule.findAll() : await Rule.findByAnalyst(req.user.id);
    return res.status(200).json(rules);
  } catch (error) {
    console.error("listRules error:", error);
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

    const templateAccess = await ensureTemplateAccess(Number(templateId), req.user);
    if (templateAccess.error) {
      return res.status(templateAccess.error.status).json({ message: templateAccess.error.message });
    }

    const ownerId =
      req.user.role === "админ" && analystId !== undefined ? analystId : req.user.id;

    const rule = await Rule.create({
      templateId: Number(templateId),
      name,
      conditionText,
      actionText,
      priority: priority !== undefined ? Number(priority) : undefined,
      analystId: ownerId,
    });
    return res.status(201).json(rule);
  } catch (error) {
    console.error("createRule error:", error);
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
    if (!canAccessByOwner(rule, req.user)) {
      return res.status(403).json({ message: "Нет доступа к правилу" });
    }
    return res.status(200).json(rule);
  } catch (error) {
    console.error("getRule error:", error);
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
    if (!canAccessByOwner(existingRule, req.user)) {
      return res.status(403).json({ message: "Нет доступа к правилу" });
    }

    if (req.body.templateId !== undefined) {
      const templateAccess = await ensureTemplateAccess(Number(req.body.templateId), req.user);
      if (templateAccess.error) {
        return res.status(templateAccess.error.status).json({ message: templateAccess.error.message });
      }
    }

    const payload = {
      templateId: req.body.templateId,
      name: req.body.name,
      conditionText: req.body.conditionText,
      actionText: req.body.actionText,
      priority: req.body.priority !== undefined ? Number(req.body.priority) : undefined,
    };
    if (req.user.role === "админ" && req.body.analystId !== undefined) {
      payload.analystId = req.body.analystId;
    }

    const updatedRule = await Rule.update(id, payload);
    return res.status(200).json(updatedRule);
  } catch (error) {
    console.error("updateRule error:", error);
    return res.status(500).json({ message: "Ошибка обновления правила" });
  }
}

async function deleteRule(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный id правила" });
    }

    const rule = await Rule.findById(id);
    if (!rule) {
      return res.status(404).json({ message: "Правило не найдено" });
    }
    if (!canAccessByOwner(rule, req.user)) {
      return res.status(403).json({ message: "Нет доступа к правилу" });
    }

    const deletedRule = await Rule.delete(id);
    return res.status(200).json(deletedRule);
  } catch (error) {
    console.error("deleteRule error:", error);
    return res.status(500).json({ message: "Ошибка удаления правила" });
  }
}

module.exports = {
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
