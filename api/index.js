// Vercel Serverless Function — wraps the Express app for serverless deployment
console.log('[api/index] Starting serverless function initialization...');

try {
  console.log('[api/index] Loading serverless-http...');
  const serverless = require('serverless-http');
  console.log('[api/index] serverless-http loaded successfully');

  console.log('[api/index] Loading backend app...');
  const app = require('../backend/index');
  console.log('[api/index] Backend app loaded successfully');

  const handler = serverless(app);
  console.log('[api/index] Handler created successfully');

  module.exports.handler = handler;
} catch (err) {
  console.error('[api/index] CRASH during initialization:', err.message);
  console.error('[api/index] Stack:', err.stack);
  throw err;
}
