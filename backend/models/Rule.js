const db = require("../config/db");

class Rule {
  static async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS rules (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
        name VARCHAR(180) NOT NULL,
        condition_text TEXT NOT NULL,
        action_text TEXT NOT NULL,
        priority INTEGER NOT NULL DEFAULT 1,
        analyst_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await db.query(sql);
  }

  static async create({ templateId, name, conditionText, actionText, priority, analystId }) {
    const sql = `
      INSERT INTO rules (template_id, name, condition_text, action_text, priority, analyst_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const { rows } = await db.query(sql, [
      templateId,
      name,
      conditionText,
      actionText,
      priority || 1,
      analystId || null,
    ]);
    return rows[0];
  }

  static async findAll() {
    const sql = `SELECT * FROM rules ORDER BY priority DESC, id ASC;`;
    const { rows } = await db.query(sql);
    return rows;
  }

  static async findByAnalyst(analystId) {
    const sql = `
      SELECT * FROM rules
      WHERE analyst_id = $1
      ORDER BY priority DESC, id ASC;
    `;
    const { rows } = await db.query(sql, [analystId]);
    return rows;
  }

  static async findById(id) {
    const sql = `SELECT * FROM rules WHERE id = $1 LIMIT 1;`;
    const { rows } = await db.query(sql, [id]);
    return rows[0] || null;
  }

  static async update(id, payload) {
    const updates = [];
    const values = [];
    let index = 1;

    if (payload.templateId !== undefined) {
      updates.push(`template_id = $${index++}`);
      values.push(payload.templateId);
    }
    if (payload.name !== undefined) {
      updates.push(`name = $${index++}`);
      values.push(payload.name);
    }
    if (payload.conditionText !== undefined) {
      updates.push(`condition_text = $${index++}`);
      values.push(payload.conditionText);
    }
    if (payload.actionText !== undefined) {
      updates.push(`action_text = $${index++}`);
      values.push(payload.actionText);
    }
    if (payload.priority !== undefined) {
      updates.push(`priority = $${index++}`);
      values.push(payload.priority);
    }
    if (payload.analystId !== undefined) {
      updates.push(`analyst_id = $${index++}`);
      values.push(payload.analystId);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    const sql = `
      UPDATE rules
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${index}
      RETURNING *;
    `;
    values.push(id);
    const { rows } = await db.query(sql, values);
    return rows[0] || null;
  }

  static async delete(id) {
    const sql = `DELETE FROM rules WHERE id = $1 RETURNING *;`;
    const { rows } = await db.query(sql, [id]);
    return rows[0] || null;
  }
}

module.exports = Rule;
