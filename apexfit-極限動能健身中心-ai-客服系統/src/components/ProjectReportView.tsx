import React from 'react';
import { BookOpen, Database, Wrench, Calculator, Terminal, ShieldCheck, CheckCircle2, Cpu, GitBranch } from 'lucide-react';

export const ProjectReportView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-slate-300">
      {/* 標題與簡介 */}
      <div className="space-y-3 border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
          <BookOpen className="w-3.5 h-3.5" />
          <span>期末專案 / 學校專案架構報告文件</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          ApexFit 極限動能健身中心 AI 客服系統 專題實作報告
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          本報告完整詳述後端架構設計、SQLite 雙資料表綱要設計、四大 Callable Tools 定義與實作邏輯、會籍精算演算法公式，以及本機啟動與測試操作指引。
        </p>
      </div>

      {/* 1. 系統架構圖 */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold text-white">
          <Cpu className="w-5 h-5 text-amber-400" />
          <h2>一、 系統整體架構與資料流 (System Architecture)</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          採現代 Full-Stack 輕量微服務架構，前端使用 React 19 與 Tailwind CSS，後端採用 Node.js Express 整合 @google/genai SDK 與 SQLite 資料庫。API Key 僅存在於伺服器端環境變數，絕不暴露於瀏覽器。
        </p>
        <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-amber-300 font-mono overflow-x-auto leading-relaxed">
{`┌────────────────────────────────────────────────────────────────────────┐
│                   前端展示層 (React 19 + Tailwind CSS)                 │
│  [💬 智能客服對話視窗]  [🧮 費用精算器]  [📊 SQLite 資料檢視]  [🧪 10題測試套件] │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP API (/api/chat, /api/db, /api/tests)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    後端服務層 (Node.js + Express)                      │
│                                                                        │
│  ┌──────────────────────────────┐    ┌──────────────────────────────┐  │
│  │     Gemini 3.8 Flash SDK     │    │   4 大 Callable Tools 執行模組│  │
│  │  • Function Calling 意圖辨識 │    │  1. lookup_gym_info          │  │
│  │  • Agent Loop (最高 5 步限制)│◄───┤  2. lookup_gym_services      │  │
│  │  • Execution Trace 歷程蒐集  │    │  3. calculate_membership_cost│  │
│  └──────────────────────────────┘    │  4. human_handoff            │  │
│                                      └──────────────┬───────────────┘  │
│                                                     │ 參數化 SQL 查詢  │
│  ┌──────────────────────────────────────────────────▼───────────────┐  │
│  │               SQLite 關聯式資料庫 (sql.js / WebAssembly)          │  │
│  │  • 表 1: gym_info (10 類營運、規範、設施、交通停車、教練團課政策)   │  │
│  │  • 表 2: gym_services (18 筆會籍方案、私人教練、團體課、加值項目)  │  │
│  │  • 表 3: human_handoff_tickets (真人轉接客訴工單儲存)            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘`}
        </pre>
      </section>

      {/* 2. 資料庫綱要 (Database Schema) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold text-white">
          <Database className="w-5 h-5 text-sky-400" />
          <h2>二、 資料庫綱要設計 (Database Schema)</h2>
        </div>

        <div className="space-y-4 text-xs">
          {/* gym_info */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-semibold text-white text-sm flex items-center justify-between">
              <span className="font-mono text-sky-400">1. 表名稱：gym_info（場館規範與營運主題）</span>
              <span className="text-[11px] text-slate-400">共 10 筆核心營運主題</span>
            </div>
            <p className="text-slate-400">
              儲存場館營業時間、地點地址交通、入場服裝毛巾規範、器材設施分區、停車折抵優惠、聯絡專線、置物櫃淋浴設施、私人教練預約請假規範、團課取消規則與飲水補給等官方真實事實。
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] text-slate-300">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2">欄位名稱 (Field)</th>
                    <th className="p-2">型態 (Type)</th>
                    <th className="p-2">約束條件</th>
                    <th className="p-2">用途說明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr><td className="p-2 text-amber-300">id</td><td className="p-2">INTEGER</td><td className="p-2">PRIMARY KEY AUTOINCREMENT</td><td className="p-2 font-sans">主鍵流水號</td></tr>
                  <tr><td className="p-2 text-amber-300">topic</td><td className="p-2">TEXT</td><td className="p-2">NOT NULL</td><td className="p-2 font-sans">主題代碼（如 opening_hours, parking, gym_rules）</td></tr>
                  <tr><td className="p-2 text-amber-300">title</td><td className="p-2">TEXT</td><td className="p-2">NOT NULL</td><td className="p-2 font-sans">繁體中文標題</td></tr>
                  <tr><td className="p-2 text-amber-300">category</td><td className="p-2">TEXT</td><td className="p-2">NOT NULL</td><td className="p-2 font-sans">分類（營運資訊 / 場館規則 / 設施服務）</td></tr>
                  <tr><td className="p-2 text-amber-300">content</td><td className="p-2">TEXT</td><td className="p-2">NOT NULL</td><td className="p-2 font-sans">完整規範與事實內容</td></tr>
                  <tr><td className="p-2 text-amber-300">keywords</td><td className="p-2">TEXT</td><td className="p-2">NULL</td><td className="p-2 font-sans">檢索關鍵字逗號分隔字串</td></tr>
                  <tr><td className="p-2 text-amber-300">updated_at</td><td className="p-2">TEXT</td><td className="p-2">NULL</td><td className="p-2 font-sans">最後更新日期</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* gym_services */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-semibold text-white text-sm flex items-center justify-between">
              <span className="font-mono text-sky-400">2. 表名稱：gym_services（服務方案與收費表）</span>
              <span className="text-[11px] text-slate-400">共 18 筆項目 (含會籍與課程)</span>
            </div>
            <p className="text-slate-400">
              儲存單次體驗票、單月健身卡、季卡、半年會籍、年度會籍、晨型人月卡、私人教練單堂/十堂/二十堂/雙人課、飛輪、瑜珈、HIIT、壺鈴、拳擊、TRX 及 InBody 檢測與置物櫃月租等。
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] text-slate-300">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2">欄位名稱 (Field)</th>
                    <th className="p-2">型態 (Type)</th>
                    <th className="p-2">約束條件</th>
                    <th className="p-2">用途說明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr><td className="p-2 text-amber-300">id</td><td className="p-2">INTEGER</td><td className="p-2">PRIMARY KEY AUTOINCREMENT</td><td className="p-2 font-sans">主鍵流水號</td></tr>
                  <tr><td className="p-2 text-amber-300">service_code</td><td className="p-2">TEXT</td><td className="p-2">UNIQUE NOT NULL</td><td className="p-2 font-sans">服務編號（如 MEM-001, PT-001, GRP-001）</td></tr>
                  <tr><td className="p-2 text-amber-300">name</td><td className="p-2">TEXT</td><td className="p-2">NOT NULL</td><td className="p-2 font-sans">服務名稱</td></tr>
                  <tr><td className="p-2 text-amber-300">category</td><td className="p-2">TEXT</td><td className="p-2">NOT NULL</td><td className="p-2 font-sans">類別（會籍方案 / 私人教練 / 團體課程 / 加值服務）</td></tr>
                  <tr><td className="p-2 text-amber-300">price</td><td className="p-2">INTEGER</td><td className="p-2">NOT NULL</td><td className="p-2 font-sans">費用金額（新台幣 NT$）</td></tr>
                  <tr><td className="p-2 text-amber-300">unit</td><td className="p-2">TEXT</td><td className="p-2">NOT NULL</td><td className="p-2 font-sans">計費單位（次 / 月 / 季 / 半年 / 年 / 堂 / 套）</td></tr>
                  <tr><td className="p-2 text-amber-300">availability</td><td className="p-2">TEXT</td><td className="p-2">NOT NULL</td><td className="p-2 font-sans">供售狀態（供售中 / 名額充裕 / 需提前預約 / 即將額滿）</td></tr>
                  <tr><td className="p-2 text-amber-300">description</td><td className="p-2">TEXT</td><td className="p-2">NULL</td><td className="p-2 font-sans">詳細方案內容與權益說明</td></tr>
                  <tr><td className="p-2 text-amber-300">duration_minutes</td><td className="p-2">INTEGER</td><td className="p-2">DEFAULT 0</td><td className="p-2 font-sans">單堂課長度分鐘數（無則為 0）</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 四項 Callable Tools 詳解 */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold text-white">
          <Wrench className="w-5 h-5 text-amber-400" />
          <h2>三、 四項 Callable Tools 定義與實作規格</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Tool 1 */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-amber-400">1. lookup_gym_info</span>
              <span className="text-[10px] text-sky-400 border border-sky-400/30 px-1.5 py-0.2 rounded font-mono">
                SELECT gym_info
              </span>
            </div>
            <p className="text-slate-300">
              檢索場館事實。後端透過參數化 Prepared Statements 搜尋 <code className="text-amber-300">title LIKE ? OR content LIKE ? OR keywords LIKE ?</code>，防範 SQL Injection，回傳結構化事實。
            </p>
            <div className="bg-slate-950 p-2 rounded text-[11px] font-mono text-slate-400">
              引數: {'{ query: string, topic?: string }'}
            </div>
          </div>

          {/* Tool 2 */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-emerald-400">2. lookup_gym_services</span>
              <span className="text-[10px] text-emerald-400 border border-emerald-400/30 px-1.5 py-0.2 rounded font-mono">
                SELECT gym_services
              </span>
            </div>
            <p className="text-slate-300">
              檢索會籍、教練課、團課的價格與名額。支援依照分類、最高預算上限與關鍵字篩選，嚴禁 AI 隨意預估價格。
            </p>
            <div className="bg-slate-950 p-2 rounded text-[11px] font-mono text-slate-400">
              引數: {'{ category?: string, query?: string, max_price?: number }'}
            </div>
          </div>

          {/* Tool 3 */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-amber-400">3. calculate_membership_cost</span>
              <span className="text-[10px] text-amber-400 border border-amber-400/30 px-1.5 py-0.2 rounded font-mono">
                Backend Deterministic
              </span>
            </div>
            <p className="text-slate-300">
              純後端數學代碼計算會籍總額與折扣。嚴禁 AI 心算！依據月數階梯、學生證減免、置物櫃月租與折扣碼計算精確數值並回傳完整算式說明。
            </p>
            <div className="bg-slate-950 p-2 rounded text-[11px] font-mono text-slate-400">
              引數: {'{ months: int, is_student: bool, include_locker?: bool, coupon_code?: str }'}
            </div>
          </div>

          {/* Tool 4 */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-rose-400">4. human_handoff</span>
              <span className="text-[10px] text-rose-400 border border-rose-400/30 px-1.5 py-0.2 rounded font-mono">
                INSERT tickets
              </span>
            </div>
            <p className="text-slate-300">
              客訴與特殊需求真人轉接。於 <code className="text-amber-300">human_handoff_tickets</code> 表建立正式工單並回傳單號、承諾回電時間與值班專線。
            </p>
            <div className="bg-slate-950 p-2 rounded text-[11px] font-mono text-slate-400">
              引數: {'{ customer_name: str, contact_phone: str, issue_category: str, ... }'}
            </div>
          </div>
        </div>
      </section>

      {/* 4. 會員計費公式詳解 */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold text-white">
          <Calculator className="w-5 h-5 text-emerald-400" />
          <h2>四、 會籍收費與階梯優惠計算演算法公式 (Calculation Formula)</h2>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
          <p className="text-slate-300 leading-relaxed">
            系統設有基礎單月會籍費率 <code className="text-amber-300">P_base = 1,288 NT$</code>，標準入會手續費 <code className="text-amber-300">F_reg = 1,000 NT$</code>，私人置物櫃租金 <code className="text-amber-300">L_fee = 300 NT$/月</code>。後端演算法公式推導如下：
          </p>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-amber-300 space-y-1">
            <div>1. 階梯時長折扣率 (R_duration)：</div>
            <div className="pl-4 text-slate-300">• 1 ≤ months &lt; 6 ：R_duration = 1.0 (無折扣)</div>
            <div className="pl-4 text-slate-300">• 6 ≤ months &lt; 12：R_duration = 0.9 (半年繳 9 折)</div>
            <div className="pl-4 text-slate-300">• months ≥ 12     ：R_duration = 0.8 (年繳享 8 折特惠)</div>
            <div className="pt-2">2. 學生身分加碼折扣 (R_student)：</div>
            <div className="pl-4 text-slate-300">• 若 is_student == true，額外享 95 折 (R_student = 0.95)；否則 R_student = 1.0</div>
            <div className="pt-2">3. 入會費減免規則 (F_reg)：</div>
            <div className="pl-4 text-slate-300">• 若 (months ≥ 12 或 is_student == true)：F_reg = NT$ 0 (全額減免免收入會費)</div>
            <div className="pl-4 text-slate-300">• 否則：F_reg = NT$ 1,000</div>
            <div className="pt-2">4. 優惠碼折抵 (D_coupon)：</div>
            <div className="pl-4 text-slate-300">• 若 coupon_code == 'APEX2026'：D_coupon = NT$ 200；否則 D_coupon = NT$ 0</div>
            <div className="pt-2">5. 最終應付總額計算公式：</div>
            <div className="pl-4 text-emerald-400 font-bold">
              Total = ⌊ 1288 × months × R_duration × R_student ⌋ + F_reg + (include_locker ? 300 × months : 0) - D_coupon
            </div>
          </div>
        </div>
      </section>

      {/* 5. 執行與測試指南 */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold text-white">
          <Terminal className="w-5 h-5 text-orange-400" />
          <h2>五、 本機環境執行與測試操作指引 (How to Run and Test)</h2>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h3 className="font-semibold text-white">1. 環境依賴安裝</h3>
            <pre className="p-2.5 rounded bg-slate-950 text-slate-300 font-mono text-[11px]">
npm install
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h3 className="font-semibold text-white">2. 環境變數設定 (.env)</h3>
            <p className="text-slate-400">複製 .env.example 為 .env 並填入 GEMINI_API_KEY：</p>
            <pre className="p-2.5 rounded bg-slate-950 text-slate-300 font-mono text-[11px]">
cp .env.example .env
# 編輯 .env 填入您的 Google AI Studio GEMINI_API_KEY
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h3 className="font-semibold text-white">3. 啟動後端與前端整合伺服器</h3>
            <pre className="p-2.5 rounded bg-slate-950 text-slate-300 font-mono text-[11px]">
npm run dev
# 伺服器將於 http://localhost:3000 啟動，自動加載 SQLite 與種子 CSV 資料
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h3 className="font-semibold text-white">4. 執行 10 題工具自動化測試評估</h3>
            <p className="text-slate-400">
              切換至頂部「10 題工具評估」分頁，點擊「執行全部 10 題測試評估」，系統將自動驗證所有題型的工具選擇正確率（Pass/Fail）。亦可透過終端機執行 lint 檢驗：
            </p>
            <pre className="p-2.5 rounded bg-slate-950 text-slate-300 font-mono text-[11px]">
npm run lint
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
};
