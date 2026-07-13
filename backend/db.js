const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

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
 * Executes a SQL query using the team-db CLI with retry logic.
 * Supports parameterized-like syntax using '?' placeholders.
 * 
 * @param {string} sql - The SQL statement with optional '?' placeholders.
 * @param {any[]} params - Array of parameters to substitute.
 * @param {number} maxRetries - Maximum number of retries.
 * @returns {Promise<any>} - The parsed JSON result from the query.
 */
async function query(sql, params = [], maxRetries = 5) {
  let finalSql = sql;
  
  if (params && params.length > 0) {
    let parts = sql.split('?');
    if (parts.length - 1 !== params.length) {
      throw new Error(`Parameter count mismatch: expected ${parts.length - 1}, got ${params.length}`);
    }
    
    finalSql = parts[0];
    for (let i = 0; i < params.length; i++) {
      finalSql += escape(params[i]) + parts[i + 1];
    }
  }

  let lastError;
  let delay = 500;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Escape double quotes for the shell command
      const escapedShellSql = finalSql.replace(/"/g, '\\"');
      const command = `team-db "${escapedShellSql}"`;
      
      const { stdout, stderr } = await execPromise(command, {
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      if (!stdout.trim()) {
        return [];
      }
      
      return JSON.parse(stdout);
    } catch (error) {
      lastError = error;
      
      const errorMessage = error.message + (error.stderr || '') + (error.stdout || '');
      
      const isTransient = 
        errorMessage.includes('Locking error') || 
        errorMessage.includes('sync engine operation failed') ||
        errorMessage.includes('unable to checkpoint') ||
        errorMessage.includes('database is locked');

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
