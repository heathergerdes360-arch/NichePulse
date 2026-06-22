
const { query } = require('./db');

async function testConcurrency() {
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(query('SELECT COUNT(*) FROM subscribers').then(res => {
      console.log(`Query ${i} success`, res);
    }).catch(err => {
      console.error(`Query ${i} failed:`, err.message);
    }));
  }
  await Promise.all(promises);
}

testConcurrency();
