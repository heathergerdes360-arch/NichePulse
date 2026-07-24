console.log('[backend] Core modules loaded, loading db...');
const { query, escape } = require('./db');
console.log('[backend] db module loaded');

dotenv.config();

console.log('[backend] Loading Stripe...');
const stripe = ...
