const { createClient } = require('@libsql/client');

/**
 * Converts a libsql:// URL to https:// for HTTP client compatibility.
 * @param {string} url 
 * @returns {string}
 */
function toHttpUrl(url) {
  if (!url) return url;
  return url.replace(/^libsql:\/\//, 'https://');
}

// Read credentials from env vars
const TURSO_URL = process.env.TURSO_DATABASE_URL || process.env.TEAM_DB_URL || '';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || process.env.TEAM_DB_AUTH_TOKEN || '';

let client = null;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.warn('WARNING: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN not set. Database queries will fail with descriptive errors.');
} else {
  try {
    client = createClient({
      url: toHttpUrl(TURSO_URL),
      authToken: TURSO_TOKEN,
    });
    console.log('Database client initialized:', toHttpUrl(TURSO_URL));
  } catch (err) {
    console.error('Failed to initialize database client:', err.message);
  }
}

/**
 * Escapes a value for SQLite to prevent injection.
 * @param {any} val 
 * @returns {string}
 */
function escape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'string') {
    return `'${val.replace(/'/g, "''")}'`;
  }
  // For arrays/objects, stringify then escape
  return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
}

/**
 * Executes a SQL query using @libsql/client with retry logic.
 * Supports parameterized-like syntax using '?' placeholders.
 * 
 * @param {string} sql - The SQL statement with optional '?' placeholders.
 * @param {any[]} params - Array of parameters to substitute.
 * @param {number} maxRetries - Maximum number of retries.
 * @returns {Promise<any[]>} - The rows from the query result.
 */
async function query(sql, params = [], maxRetries = 5) {
  if (!client) {
    throw new Error(
      'Database not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables.'
    );
  }

  let finalSql = sql;
  let finalParams = [];

  if (params && params.length > 0) {
    let parts = sql.split('?');
    if (parts.length - 1 !== params.length) {
      throw new Error(`Parameter count mismatch: expected ${parts.length - 1}, got ${params.length}`);
    }

    finalSql = parts[0];
    for (let i = 0; i < params.length; i++) {
      finalSql += `?${parts[i + 1]}`;
      finalParams.push(params[i]);
    }
  }

  let lastError;
  let delay = 500;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // If there are no params and the SQL has no ? placeholders,
      // execute directly. If the SQL was built with escape() inline,
      // it's already safe and we pass it as-is.
      let result;
      if (finalParams.length > 0) {
        result = await client.execute(finalSql, finalParams);
      } else {
        result = await client.execute(finalSql);
      }

      // Return rows in a consistent format
      if (!result || !result.rows) {
        return [];
      }

      // Transform rows from @libsql/client format to plain objects
      return result.rows.map(row => {
        const obj = {};
        // @libsql/client rows have columns as keys
        for (const key of result.columns) {
          obj[key] = row[key];
        }
        return obj;
      });
    } catch (error) {
      lastError = error;

      const errorMessage = error.message || String(error);

      const isTransient =
        errorMessage.includes('Locking error') ||
        errorMessage.includes('sync engine operation failed') ||
        errorMessage.includes('unable to checkpoint') ||
        errorMessage.includes('database is locked') ||
        errorMessage.includes('CONCURRENT_TRIGGER_ERROR') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('rate limit');

      if (!isTransient) {
        throw new Error(errorMessage);
      }

      console.warn(`Database query attempt ${attempt} failed (transient): ${errorMessage.trim()}. Retrying in ${delay}ms...`);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  }

  throw new Error(`Database query failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
}

module.exports = { query, escape };