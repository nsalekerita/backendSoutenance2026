"use strict";
const { Pool } = require('pg');
const { env } = require('./env');

const pool = new Pool({
  connectionString: env.databaseUrl || undefined,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : false,
  max: env.databasePoolMax,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
pool.on('error', (error) => console.error('[database] connexion inactive en erreur:', error.message));
const query = (text, params) => pool.query(text, params);
async function transaction(callback) {
  const client = await pool.connect();
  try { await client.query('BEGIN'); const result = await callback(client); await client.query('COMMIT'); return result; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
module.exports = { pool, query, transaction };
