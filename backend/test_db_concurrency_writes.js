
const { query } = require('./db');

async function testConcurrencyWrites() {
  const promises = [];
  for (let i = 0; i < 10; i++) {
    const email = `concurrency_test_${Date.now()}_${i}@example.com`;
    promises.push(query(`INSERT INTO subscribers (email) VALUES ('${email}')`).then(res => {
      console.log(`Write ${i} success`, res);
    }).catch(err => {
      console.error(`Write ${i} failed:`, err.message);
    }));
  }
  await Promise.all(promises);
}

testConcurrencyWrites();
