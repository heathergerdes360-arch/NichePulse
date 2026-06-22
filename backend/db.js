const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Executes a SQL query using the team-db CLI with retry logic.
 * @param {string} sql - The SQL statement to execute.
 * @param {number} maxRetries - Maximum number of retries.
 * @returns {Promise<any>} - The parsed JSON result from the query.
 */
async function query(sql, maxRetries = 5) {
  let lastError;
  let delay = 500; // Start with 500ms delay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Escape double quotes for the shell command
      const escapedSql = sql.replace(/"/g, '\\"');
      const command = `team-db "${escapedSql}"`;
      
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
      
      // Determine if error is transient/retryable
      const isTransient = 
        errorMessage.includes('Locking error') || 
        errorMessage.includes('sync engine operation failed') ||
        errorMessage.includes('unable to checkpoint') ||
        errorMessage.includes('database is locked');

      if (!isTransient) {
        // Permanent error, don't retry
        throw new Error(errorMessage);
      }

      console.warn(`Database query attempt ${attempt} failed (transient): ${errorMessage.trim()}. Retrying in ${delay}ms...`);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  throw new Error(`Database query failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
}

/**
 * Escapes a string for SQLite.
 * @param {string} str 
 * @returns {string}
 */
function escape(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/'/g, "''");
}

module.exports = { query, escape };
