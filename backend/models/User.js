const db = require("../config/db");

class User {
  static async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(120) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'аналитик' CHECK (role IN ('аналитик', 'админ')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await db.query(sql);
  }

  static async create({ name, email, passwordHash, role = "аналитик" }) {
    const sql = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at, updated_at;
    `;
    const { rows } = await db.query(sql, [name, email, passwordHash, role]);
    return rows[0];
  }

  static async findByEmail(email) {
    const sql = `SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;`;
    const { rows } = await db.query(sql, [email]);
    return rows[0] || null;
  }

  static async findById(id) {
    const sql = `
      SELECT id, name, email, role, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1;
    `;
    const { rows } = await db.query(sql, [id]);
    return rows[0] || null;
  }

  static async findWithPasswordById(id) {
    const sql = `SELECT * FROM users WHERE id = $1 LIMIT 1;`;
    const { rows } = await db.query(sql, [id]);
    return rows[0] || null;
  }

  static async findAll() {
    const sql = `
      SELECT id, name, email, role, created_at, updated_at
      FROM users
      ORDER BY id ASC;
    `;
    const { rows } = await db.query(sql);
    return rows;
  }

  static async update(id, payload) {
    const updates = [];
    const values = [];
    let index = 1;

    if (payload.name !== undefined) {
      updates.push(`name = $${index++}`);
      values.push(payload.name);
    }
    if (payload.email !== undefined) {
      updates.push(`email = $${index++}`);
      values.push(payload.email);
    }
    if (payload.passwordHash !== undefined) {
      updates.push(`password_hash = $${index++}`);
      values.push(payload.passwordHash);
    }
    if (payload.role !== undefined) {
      updates.push(`role = $${index++}`);
      values.push(payload.role);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    const sql = `
      UPDATE users
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${index}
      RETURNING id, name, email, role, created_at, updated_at;
    `;
    values.push(id);
    const { rows } = await db.query(sql, values);
    return rows[0] || null;
  }

  static async delete(id) {
    const sql = `
      DELETE FROM users
      WHERE id = $1
      RETURNING id, name, email, role, created_at, updated_at;
    `;
    const { rows } = await db.query(sql, [id]);
    return rows[0] || null;
  }
}

module.exports = User;
