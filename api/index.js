// Vercel Serverless Function — wraps the Express app for serverless deployment
const serverless = require('serverless-http');
const app = require('../backend/index');

module.exports.handler = serverless(app);
