const db = require("../config/db");

class Requirement {
  static async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS requirements (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
        title VARCHAR(180) NOT NULL,
        details TEXT,
        status VARCHAR(40) NOT NULL DEFAULT 'draft',
        analyst_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await db.query(sql);
  }

  static async create({ templateId, title, details, status, analystId }) {
    const sql = `
      INSERT INTO requirements (template_id, title, details, status, analyst_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const { rows } = await db.query(sql, [
      templateId,
      title,
      details || null,
      status || "draft",
      analystId || null,
    ]);
    return rows[0];
  }

  static async findAll() {
    const sql = `SELECT * FROM requirements ORDER BY id ASC;`;
    const { rows } = await db.query(sql);
    return rows;
  }

  static async findByAnalyst(analystId) {
    const sql = `SELECT * FROM requirements WHERE analyst_id = $1 ORDER BY id ASC;`;
    const { rows } = await db.query(sql, [analystId]);
    return rows;
  }

  static async findById(id) {
    const sql = `SELECT * FROM requirements WHERE id = $1 LIMIT 1;`;
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
    if (payload.title !== undefined) {
      updates.push(`title = $${index++}`);
      values.push(payload.title);
    }
    if (payload.details !== undefined) {
      updates.push(`details = $${index++}`);
      values.push(payload.details);
    }
    if (payload.status !== undefined) {
      updates.push(`status = $${index++}`);
      values.push(payload.status);
    }
    if (payload.analystId !== undefined) {
      updates.push(`analyst_id = $${index++}`);
      values.push(payload.analystId);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    const sql = `
      UPDATE requirements
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${index}
      RETURNING *;
    `;
    values.push(id);
    const { rows } = await db.query(sql, values);
    return rows[0] || null;
  }

  static async delete(id) {
    const sql = `DELETE FROM requirements WHERE id = $1 RETURNING *;`;
    const { rows } = await db.query(sql, [id]);
    return rows[0] || null;
  }
}

module.exports = Requirement;
