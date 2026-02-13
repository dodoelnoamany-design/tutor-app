const { parentPort, workerData } = require('worker_threads');
const path = require('path');

let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  parentPort.postMessage({ id: '0', success: false, error: 'better-sqlite3 not installed: ' + (e && e.message) });
  process.exit(1);
}

const dbPath = workerData && workerData.dbPath ? workerData.dbPath : path.join(__dirname, 'db.sqlite');

let db;
try {
  db = new Database(dbPath);
} catch (e) {
  parentPort.postMessage({ id: '0', success: false, error: 'Failed to open DB: ' + (e && e.message) });
  process.exit(1);
}

function sendResponse(id, payload) {
  parentPort.postMessage(Object.assign({ id }, payload));
}

// On startup, ensure basic tables exist and create indexes when appropriate
try {
  // create minimal tables if not present (preserve previous behavior)
  db.prepare("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);").run();
  db.prepare("CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, code TEXT, name TEXT, qty REAL DEFAULT 0, meta TEXT);").run();
  // create movements table if not exists (used in codebase)
  db.prepare("CREATE TABLE IF NOT EXISTS movements (id TEXT PRIMARY KEY, itemId TEXT, type TEXT, quantity INTEGER, unitId TEXT, docNumber TEXT, timestamp TEXT, balanceAfter INTEGER, note TEXT, unitPrice REAL, returnedQuantity INTEGER);").run();

  // Create indexes only if corresponding tables/columns exist
  const tbls = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
  const has = (t) => tbls.includes(t);
  if (has('items')) {
    try { db.prepare('CREATE INDEX IF NOT EXISTS idx_items_code ON items(code);').run(); } catch (e) {}
    try { db.prepare('CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);').run(); } catch (e) {}
  }
  if (has('movements')) {
    try { db.prepare('CREATE INDEX IF NOT EXISTS idx_movements_timestamp ON movements(timestamp);').run(); } catch (e) {}
    try { db.prepare('CREATE INDEX IF NOT EXISTS idx_movements_doc ON movements(docNumber);').run(); } catch (e) {}
  }
  if (has('invoices')) {
    try { db.prepare('CREATE INDEX IF NOT EXISTS idx_invoices_customer_name ON invoices(customer_name);').run(); } catch (e) {}
    try { db.prepare('CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);').run(); } catch (e) {}
  }
} catch (e) {
  // continue — not fatal
}

parentPort.on('message', async (msg) => {
  const { id, action, sql, params } = msg || {};
  if (!id) return;
  try {
    if (action === 'filePath') {
      sendResponse(id, { success: true, path: dbPath });
      return;
    }

    if (!sql) {
      sendResponse(id, { success: false, error: 'Missing SQL' });
      return;
    }

    const upper = sql.trim().toUpperCase();
    if (action === 'run' || !upper.startsWith('SELECT')) {
      // write/modify
      const stmt = db.prepare(sql);
      let info;
      if (params && Array.isArray(params)) info = stmt.run(...params);
      else if (params && typeof params === 'object') info = stmt.run(params);
      else info = stmt.run();
      sendResponse(id, { success: true, info });
      return;
    }

    if (action === 'get' || upper.startsWith('SELECT')) {
      const stmt = db.prepare(sql);
      let row;
      if (action === 'get') {
        if (params && Array.isArray(params)) row = stmt.get(...params);
        else if (params && typeof params === 'object') row = stmt.get(params);
        else row = stmt.get();
        sendResponse(id, { success: true, row });
        return;
      }

      // action === 'all' or select
      const rows = params && (Array.isArray(params) || typeof params === 'object') ? stmt.all(params) : stmt.all();
      sendResponse(id, { success: true, rows });
      return;
    }

    sendResponse(id, { success: false, error: 'Unknown action' });
  } catch (err) {
    sendResponse(id, { success: false, error: (err && err.message) || String(err) });
  }
});
