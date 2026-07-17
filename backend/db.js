const { createClient } = require('@libsql/client');

function toHttpUrl(url) {
  if (!url) return url;
  return url.replace(/^libsql:\/\//, 'https://');
}

const TURSO_URL = process.env.TURSO_DATABASE_URL || process.env.TEAM_DB_URL || '';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || process.env.TEAM_DB_AUTH_TOKEN || '';

let client = null;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.warn('WARNING: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN not set. Database queries will fail.');
} else {
  try {
    client = createClient({ url: toHttpUrl(TURSO_URL), authToken: TURSO_TOKEN });
    console.log('DB client initialized:', toHttpUrl(TURSO_URL));
  } catch (err) {
    console.error('Failed to init DB client:', err.message);
  }
}

function escape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
  return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
}

async function query(sql, params = [], maxRetries = 5) {
  if (!client) throw new Error('Database not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');

  let finalSql = sql;
  let finalParams = [];

  if (params && params.length > 0) {
    let parts = sql.split('?');
    if (parts.length - 1 !== params.length)
      throw new Error(`Parameter count mismatch: expected ${parts.length - 1}, got ${params.length}`);
    finalSql = parts[0];
    for (let i = 0; i < params.length; i++) {
      finalSql += `?${parts[i + 1]}`;
      finalParams.push(params[i]);
    }
  }

  let lastError, delay = 500;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = finalParams.length > 0
        ? await client.execute(finalSql, finalParams)
        : await client.execute(finalSql);
      if (!result || !result.rows) return [];
      return result.rows.map(row => {
        const obj = {};
        for (const key of result.columns) obj[key] = row[key];
        return obj;
      });
    } catch (error) {
      lastError = error;
      const msg = error.message || String(error);
      const isTransient = msg.includes('Locking error') || msg.includes('sync engine') ||
        msg.includes('unable to checkpoint') || msg.includes('database is locked') ||
        msg.includes('timeout') || msg.includes('rate limit');
      if (!isTransient) throw new Error(msg);
      console.warn(`DB query attempt ${attempt} failed: ${msg.trim()}. Retrying in ${delay}ms...`);
      if (attempt < maxRetries) await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
  throw new Error(`DB query failed after ${maxRetries} attempts: ${lastError.message}`);
}

module.exports = { query, escape };