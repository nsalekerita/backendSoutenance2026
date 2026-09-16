"use strict";
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function main() {
  const migrationsDir = path.join(__dirname, 'postgres');
  const files = fs.readdirSync(migrationsDir).filter((name) => name.endsWith('.sql')).sort();
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  for (const name of files) {
    const exists = await pool.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name]);
    if (exists.rowCount) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, name), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [name]);
      await client.query('COMMIT');
      console.log(`[migration] ${name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }
}
main().then(() => pool.end()).catch((error) => { console.error(error); pool.end().finally(() => process.exit(1)); });
