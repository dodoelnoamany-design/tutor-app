const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

function init(ipcMain, app) {
  const userData = app.getPath('userData');
  // Canonical DB filename: db.sqlite (legacy installers may have used data.sqlite)
  const dbPath = path.join(userData, 'db.sqlite');
  const legacyDbPath = path.join(userData, 'data.sqlite');
  fs.mkdirSync(userData, { recursive: true });

  // If a legacy file exists and the canonical one does not, prefer the legacy file
  try {
    const { Worker, isMainThread } = require('worker_threads');
    const path = require('path');
    const fs = require('fs');

    function init(ipcMain, app) {
      const userData = app.getPath('userData');
      const dbPath = path.join(userData, 'db.sqlite');
      fs.mkdirSync(userData, { recursive: true });

      // If a legacy file exists and the canonical one does not, prefer the legacy file
      try {
        const legacyDbPath = path.join(userData, 'data.sqlite');
        if (fs.existsSync(legacyDbPath) && !fs.existsSync(dbPath)) {
          try { fs.copyFileSync(legacyDbPath, dbPath); } catch (e) { /* ignore */ }
        }
      } catch (e) { /* ignore */ }

      // Spawn a worker thread which will perform all DB operations using better-sqlite3
      const workerFile = path.join(__dirname, 'db.worker.js');
      const worker = new Worker(workerFile, { workerData: { dbPath } });

      // request/response map
      const pending = new Map();
      let nextId = 1;

      worker.on('message', (msg) => {
        if (!msg || !msg.id) return;
        const { id } = msg;
        const p = pending.get(id);
        if (!p) return;
        pending.delete(id);
        if (msg.success) p.resolve(msg);
        else p.reject(new Error(msg.error || 'unknown'));
      });

      worker.on('error', (err) => { console.error('DB worker error', err); });
      worker.on('exit', (code) => { if (code !== 0) console.error('DB worker exited with', code); });

      function sendToWorker(action, payload) {
        return new Promise((resolve, reject) => {
          const id = String(nextId++);
          pending.set(id, { resolve, reject });
          worker.postMessage(Object.assign({ id, action }, payload || {}));
          // timeout fallback
          setTimeout(() => {
            if (pending.has(id)) {
              pending.delete(id);
              reject(new Error('DB worker timeout'));
            }
          }, 30000);
        });
      }

      ipcMain.handle('db-run', async (event, sql, params) => {
        try {
          const res = await sendToWorker('run', { sql, params });
          return res;
        } catch (e) {
          return { success: false, error: e.message };
        }
      });

      ipcMain.handle('db-get', async (event, sql, params) => {
        try {
          const res = await sendToWorker('get', { sql, params });
          return res;
        } catch (e) {
          return { success: false, error: e.message };
        }
      });

      ipcMain.handle('db-all', async (event, sql, params) => {
        try {
          const res = await sendToWorker('all', { sql, params });
          return res;
        } catch (e) {
          return { success: false, error: e.message };
        }
      });

      ipcMain.handle('db-file-path', async () => ({ path: dbPath }));
    }

    module.exports = { init };
      let row = null;
