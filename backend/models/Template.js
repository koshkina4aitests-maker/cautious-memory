const db = require("../config/db");

class Template {
  static async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        schema TEXT,
        analyst_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await db.query(sql);
  }

  static async create({ name, description, schema, analystId }) {
    const sql = `
      INSERT INTO templates (name, description, schema, analyst_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const { rows } = await db.query(sql, [
      name,
      description || null,
      schema || null,
      analystId || null,
    ]);
    return rows[0];
  }

  static async findAll() {
    const sql = `SELECT * FROM templates ORDER BY id ASC;`;
    const { rows } = await db.query(sql);
    return rows;
  }

  static async findByAnalyst(analystId) {
    const sql = `SELECT * FROM templates WHERE analyst_id = $1 ORDER BY id ASC;`;
    const { rows } = await db.query(sql, [analystId]);
    return rows;
  }

  static async findById(id) {
    const sql = `SELECT * FROM templates WHERE id = $1 LIMIT 1;`;
    const { rows } = await db.query(sql, [id]);
    return rows[0] || null;
  }

  static async update(id, payload) {
    const updates = [];
    const values = [];
    let index = 1;

    if (payload.name !== undefined) {
      updates.push(`name = $${index++}`);
      values.push(payload.name);
    }
    if (payload.description !== undefined) {
      updates.push(`description = $${index++}`);
      values.push(payload.description);
    }
    if (payload.schema !== undefined) {
      updates.push(`schema = $${index++}`);
      values.push(payload.schema);
    }
    if (payload.analystId !== undefined) {
      updates.push(`analyst_id = $${index++}`);
      values.push(payload.analystId);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    const sql = `
      UPDATE templates
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${index}
      RETURNING *;
    `;
    values.push(id);
    const { rows } = await db.query(sql, values);
    return rows[0] || null;
  }

  static async delete(id) {
    const sql = `DELETE FROM templates WHERE id = $1 RETURNING *;`;
    const { rows } = await db.query(sql, [id]);
    return rows[0] || null;
  }
}

module.exports = Template;
