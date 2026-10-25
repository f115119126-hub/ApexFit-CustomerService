import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { getDatabase, queryAll } from './server/db.ts';
import { runAgentConversation } from './server/agent.ts';
import { STANDARD_TEST_CASES, runSingleTest, runAllStandardTests } from './server/testSuite.ts';
import { executeToolCall } from './server/tools.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // 初始化 SQLite 資料庫
  const db = await getDatabase();
  console.log('⚡ SQLite 資料庫就緒');

  // 1. 聊天主要端點 (Agent Loop + Gemini Function Calling)
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: '請提供有效的訊息字串' });
      }

      const result = await runAgentConversation(db, message, history || []);
      res.json(result);
    } catch (err: any) {
      console.error('Chat API 錯誤:', err);
      res.status(500).json({
        error: '處理對話時發生伺服器錯誤',
        message: err.message || String(err),
      });
    }
  });

  // 2. 資料庫查詢端點：取得所有場館主題 (gym_info)
  app.get('/api/db/info', (req, res) => {
    try {
      const rows = queryAll(db, 'SELECT * FROM gym_info ORDER BY id ASC');
      res.json({ count: rows.length, data: rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. 資料庫查詢端點：取得所有課程與會籍方案 (gym_records / gym_services)
  app.get('/api/db/records', (req, res) => {
    try {
      const rows = queryAll(db, 'SELECT * FROM gym_records ORDER BY category ASC, price ASC');
      res.json({ count: rows.length, data: rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/db/services', (req, res) => {
    try {
      const rows = queryAll(db, 'SELECT * FROM gym_records ORDER BY category ASC, price ASC');
      res.json({ count: rows.length, data: rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. 資料庫查詢端點：取得所有客服轉接工單 (human_handoff_tickets)
  app.get('/api/db/tickets', (req, res) => {
    try {
      const rows = queryAll(db, 'SELECT * FROM human_handoff_tickets ORDER BY created_at DESC');
      res.json({ count: rows.length, data: rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. 測試套件：取得標準 10 題測試題目
  app.get('/api/tests/cases', (req, res) => {
    res.json({ testCases: STANDARD_TEST_CASES });
  });

  // 6. 測試套件：單題執行測試
  app.post('/api/tests/run-single', async (req, res) => {
    try {
      const { id } = req.body;
      const testCase = STANDARD_TEST_CASES.find((t) => t.id === Number(id));
      if (!testCase) {
        return res.status(404).json({ error: `找不到 ID 為 ${id} 的測試項目` });
      }
      const testResult = await runSingleTest(db, testCase);
      res.json(testResult);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. 測試套件：全部 10 題一次批次評估
  app.post('/api/tests/run-all', async (req, res) => {
    try {
      const suiteResult = await runAllStandardTests(db);
      res.json(suiteResult);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. 專用後端計費公式直接計算 (免去 AI 轉譯，便於評審直觀比對演算法)
  app.post('/api/calculator/direct', async (req, res) => {
    try {
      const { months, is_student, include_locker, coupon_code } = req.body;
      const { result, record } = await executeToolCall(db, 'calculate_membership_cost', {
        months,
        is_student,
        include_locker,
        coupon_code,
      });
      res.json({ result, record });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 整合 Vite 中介軟體 (開發模式) 或靜態檔案代理 (正式環境)
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 ApexFit 健身客服後端已於 http://0.0.0.0:${PORT} 啟動完成`);
  });
}

startServer().catch((err) => {
  console.error('啟動伺服器失敗:', err);
});
