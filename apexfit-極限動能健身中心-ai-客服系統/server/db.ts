import initSqlJs from 'sql.js';
import type { Database, Statement } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
const DB_FILE_PATH = path.resolve(process.cwd(), 'data/gym.sqlite');

// 簡易且穩健的 CSV 行解析函式 (處理引號內的逗號與換行)
function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let currentToken = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++; // 跳過下一個跳脫的引號
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentToken.trim());
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentToken.trim());
      currentToken = '';
      if (row.some(cell => cell.length > 0)) {
        lines.push(row);
      }
      row = [];
    } else {
      currentToken += char;
    }
  }

  if (currentToken.length > 0 || row.length > 0) {
    row.push(currentToken.trim());
    if (row.some(cell => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

export async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();

  if (!fs.existsSync(path.dirname(DB_FILE_PATH))) {
    fs.mkdirSync(path.dirname(DB_FILE_PATH), { recursive: true });
  }

  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      dbInstance = new SQL.Database(fileBuffer);
      console.log('✅ 成功載入既有 SQLite 資料庫檔案:', DB_FILE_PATH);
    } catch (err) {
      console.warn('⚠️ 既有資料庫讀取失敗，將重新初始化:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    // 建立全新記憶體資料庫並寫入表結構
    dbInstance = new SQL.Database();
    console.log('📦 初始化全新 SQLite 資料庫結構...');
  }

  // 1. 確保 gym_info 表存在
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS gym_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      keywords TEXT,
      updated_at TEXT
    );
  `);

  // 2. 確保 gym_records 表存在
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS gym_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      unit TEXT NOT NULL,
      availability TEXT NOT NULL,
      description TEXT,
      duration_minutes INTEGER DEFAULT 0
    );
  `);

  // 確保 gym_services 視圖或同名相容表存在
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS gym_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      unit TEXT NOT NULL,
      availability TEXT NOT NULL,
      description TEXT,
      duration_minutes INTEGER DEFAULT 0
    );
  `);

  // 3. 確保 human_handoff_tickets 表存在
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS human_handoff_tickets (
      ticket_id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      issue_category TEXT NOT NULL,
      issue_description TEXT NOT NULL,
      urgency TEXT NOT NULL,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL
    );
  `);

  // 檢查資料筆數，若為 0 則匯入 CSV 種子
  const infoCountRes = dbInstance.exec('SELECT COUNT(*) as cnt FROM gym_info');
  const infoCount = infoCountRes[0]?.values[0]?.[0] as number || 0;
  const recordsCountRes = dbInstance.exec('SELECT COUNT(*) as cnt FROM gym_records');
  const recordsCount = recordsCountRes[0]?.values[0]?.[0] as number || 0;

  if (infoCount === 0 || recordsCount === 0) {
    console.log('🌱 匯入或補充 CSV 種子資料...');
    await seedDatabase(dbInstance);
  }

  saveDatabase(dbInstance);
  return dbInstance;
}

async function seedDatabase(db: Database) {
  const gymInfoCsvPath = path.resolve(process.cwd(), 'data/seeds/gym_info.csv');
  const gymRecordsCsvPath = fs.existsSync(path.resolve(process.cwd(), 'data/seeds/gym_records.csv'))
    ? path.resolve(process.cwd(), 'data/seeds/gym_records.csv')
    : path.resolve(process.cwd(), 'data/seeds/gym_services.csv');

  if (fs.existsSync(gymInfoCsvPath)) {
    const rawContent = fs.readFileSync(gymInfoCsvPath, 'utf-8');
    const rows = parseCSV(rawContent);
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 6) {
        const topic = row[1];
        const title = row[2];
        const category = row[3];
        const content = row[4];
        const keywords = row[5] || '';
        const updated_at = row[6] || new Date().toISOString().split('T')[0];

        db.run(
          'INSERT INTO gym_info (topic, title, category, content, keywords, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [topic, title, category, content, keywords, updated_at]
        );
      }
    }
    console.log(`✅ 已自 CSV 成功匯入 ${rows.length - 1} 筆 gym_info 資料`);
  }

  if (fs.existsSync(gymRecordsCsvPath)) {
    const rawContent = fs.readFileSync(gymRecordsCsvPath, 'utf-8');
    const rows = parseCSV(rawContent);
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 7) {
        const service_code = row[1];
        const name = row[2];
        const category = row[3];
        const price = parseInt(row[4], 10) || 0;
        const unit = row[5];
        const availability = row[6];
        const description = row[7] || '';
        const duration_minutes = parseInt(row[8], 10) || 0;

        db.run(
          'INSERT OR IGNORE INTO gym_records (service_code, name, category, price, unit, availability, description, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [service_code, name, category, price, unit, availability, description, duration_minutes]
        );
        db.run(
          'INSERT OR IGNORE INTO gym_services (service_code, name, category, price, unit, availability, description, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [service_code, name, category, price, unit, availability, description, duration_minutes]
        );
      }
    }
    console.log(`✅ 已自 CSV 成功匯入 ${rows.length - 1} 筆 gym_records 資料`);
  }
}

export function saveDatabase(db: Database) {
  try {
    const data = db.export();
    fs.writeFileSync(DB_FILE_PATH, Buffer.from(data));
  } catch (err) {
    console.error('儲存 SQLite 檔案失敗:', err);
  }
}

// 輔助查詢函式：以參數化查詢回傳物件陣列
export function queryAll<T = Record<string, any>>(db: Database, sql: string, params: any[] = []): T[] {
  const stmt: Statement = db.prepare(sql);
  try {
    stmt.bind(params);
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    return results;
  } finally {
    stmt.free();
  }
}

// 輔助單筆查詢函式
export function queryOne<T = Record<string, any>>(db: Database, sql: string, params: any[] = []): T | null {
  const results = queryAll<T>(db, sql, params);
  return results.length > 0 ? results[0] : null;
}
