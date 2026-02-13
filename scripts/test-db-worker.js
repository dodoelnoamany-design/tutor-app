const { Worker } = require('worker_threads');
const path = require('path');
const fs = require('fs');

(async () => {
  const tmpDb = path.join(__dirname, 'test-db.sqlite');
  if (fs.existsSync(tmpDb)) try { fs.unlinkSync(tmpDb); } catch (e) {}

  const workerFile = path.join(__dirname, '..', 'db.worker.js');
  console.log('Starting DB worker test using', workerFile);

  const worker = new Worker(workerFile, { workerData: { dbPath: tmpDb } });

  worker.on('message', (msg) => {
    console.log('Worker msg:', msg);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
    process.exit(1);
  });

  worker.on('exit', (code) => {
    console.log('Worker exited with', code);
  });

  function send(action, sql, params) {
    return new Promise((resolve, reject) => {
      const id = String(Math.floor(Math.random() * 1e9));
      const onMsg = (msg) => {
        if (!msg || msg.id !== id) return;
        worker.off('message', onMsg);
        if (msg.success) resolve(msg);
        else reject(new Error(msg.error || 'unknown'));
      };
      worker.on('message', onMsg);
      worker.postMessage({ id, action, sql, params });
      setTimeout(() => {
        worker.off('message', onMsg);
        reject(new Error('timeout'));
      }, 10000);
    });
  }

  try {
    // create a test table
    console.log('Creating test table...');
    await send('run', "CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, created_at TEXT);");

    console.log('Inserting rows...');
    await send('run', "INSERT INTO test_table (name, created_at) VALUES (?, ?);", ['Alice', new Date().toISOString()]);
    await send('run', "INSERT INTO test_table (name, created_at) VALUES (?, ?);", ['Bob', new Date().toISOString()]);

    console.log('Querying all rows...');
    const allRes = await send('all', 'SELECT * FROM test_table ORDER BY id;');
    console.log('All rows:', allRes.rows);

    console.log('Query single row...');
    const one = await send('get', 'SELECT * FROM test_table WHERE name = ?;', ['Alice']);
    console.log('Single row:', one.row);

    console.log('Test completed successfully. DB file at:', tmpDb);
  } catch (err) {
    console.error('Test failed:', err && err.message ? err.message : err);
  } finally {
    try { worker.terminate(); } catch (e) {}
  }
})();
