
const { query } = require('./db');

async function testResilience() {
  console.log('--- Testing Success with Concurrency ---');
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(query('SELECT COUNT(*) FROM subscribers').then(res => {
      console.log(`Success ${i}`, res);
    }).catch(err => {
      console.error(`Failed ${i}:`, err.message);
    }));
  }
  await Promise.all(promises);

  console.log('\n--- Testing Permanent Error (should not retry) ---');
  try {
    await query('SELECT * FROM non_existent_table');
  } catch (err) {
    console.log('Caught expected permanent error:', err.message);
  }
}

testResilience();
