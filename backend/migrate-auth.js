#!/usr/bin/env node
/**
 * Magic Auth Migration
 * Creates tables for passwordless email magic link auth + session management
 */
const { execSync } = require('child_process');

function run(sql) {
  try {
    const escaped = sql.replace(/"/g, '\\"');
    const out = execSync(`team-db "${escaped}"`, { maxBuffer: 10 * 1024 * 1024, timeout: 15000 });
    return JSON.parse(out.toString());
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('  (table already exists)');
    } else {
      console.error(`  Error: ${err.message.substring(0, 100)}`);
    }
    return null;
  }
}

console.log('=== Magic Auth Migration ===\n');

// 1. Auth tokens table (for magic link tokens)
console.log('1. Creating auth_tokens table...');
run(`
  CREATE TABLE IF NOT EXISTS auth_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);
console.log('   Done\n');

// 2. Sessions table
console.log('2. Creating sessions table...');
run(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    last_used_at TEXT,
    is_active INTEGER DEFAULT 1
  )
`);
console.log('   Done\n');

// Verify
console.log('=== Verification ===');
const tables = run("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('auth_tokens', 'sessions') ORDER BY name");
if (tables) {
  tables.forEach(t => console.log(`  - ${t.name}`));
}

console.log('\n=== Migration Complete ===');