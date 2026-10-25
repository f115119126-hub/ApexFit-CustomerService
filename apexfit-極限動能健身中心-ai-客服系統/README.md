# ApexFit 極限動能健身中心 AI 智能客服系統
> **學校專題作業 / 期末成果報告 (Full-Stack AI Gym Customer Service System)**

本專案為「ApexFit 極限動能健身中心」專屬打造之 Full-Stack 繁體中文 AI 智能客服系統。系統結合 **Node.js Express 伺服器**、**Google Gemini 3.8 Flash** 函式調用（Function Calling）機制、**SQLite 關聯式資料庫**、**確定性費用計算引擎**與**即時工具調用歷程可視化（Tool Execution Trace）**，並提供 **10 道工具選擇自動化評估測試套件**，徹底解決大語言模型在數字運算及資訊檢索上的「幻覺（Hallucination）」問題。

---

## 🌟 核心特色與符合規範 (Key Highlights)

1. **零幻覺保證（Zero-Hallucination via Tool Use）**：
   - AI 客服被嚴格指示不得憑空捏造營業時間、規則、收費或名額。
   - 所有的場館規範均由資料庫檢索工具提供；所有會籍試算均由後端純 TypeScript 數學函式精算。
2. **前後端分離與資安規範（Full-Stack Security）**：
   - 瀏覽器端絕不包含任何 API Key。
   - 所有 Gemini API 呼叫均封裝於後端 Express 路由（`/api/chat`），透過 `process.env.GEMINI_API_KEY` 認證。
3. **SQLite 參數化查詢（Prepared Statements）**：
   - 採用標準 SQL Prepared Statements（`?` 佔位符）進行字串查詢與過濾，防範 SQL Injection 注入攻擊。
4. **Agent Loop 防死循環限制（Safety Max Steps）**：
   - 後端設有最高 5 步（Max 5 Steps）的 Agent Loop 防護機制，確保模型在多次工具調用時能及時跳出並輸出回覆。
5. **即時工具歷程透視（Visible Tool Execution Trace）**：
   - 前端聊天訊息卡片隨附折疊式工具歷程，直觀呈現：調用工具名稱、傳入引數（JSON）、後端處理 SQL 或算式、回傳資料摘要與執行耗時（毫秒）。
6. **10 題工具自動化評估面板（10-Question Test Suite）**：
   - 內建 10 道標準測試案例，支援「單題驗證」與「一鍵批次評估」，即時記錄 PASS/FAIL、通過率與回覆內容。

---

## 🗄️ 資料庫綱要設計 (Database Schema)

系統採用輕量高效的 SQLite 關聯式資料庫（搭配 WebAssembly `sql.js` 引擎），包含以下三個主要資料表：

### 1. `gym_info`（場館營運與規範表）
收錄 10 類核心場館主題（超越題目至少 8 類的要求），提供營業時間、地址交通、規則、設施等事實依據。

| 欄位名稱 (Column) | 資料型態 (Type) | 約束 (Constraint) | 說明 (Description) |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | 主鍵流水號 |
| `topic` | TEXT | NOT NULL | 主題代碼（如 `opening_hours`, `parking`, `gym_rules`） |
| `title` | TEXT | NOT NULL | 繁體中文主題標題（如「營業時間與假日公告」） |
| `category` | TEXT | NOT NULL | 分類（營運資訊 / 場館規則 / 設施服務） |
| `content` | TEXT | NOT NULL | 詳細規範內容與官方事實文字 |
| `keywords` | TEXT | NULL | 供檢索匹配的關鍵字標籤字串 |
| `updated_at` | TEXT | NULL | 最後更新日期 |

**收錄主題清單 (10 類)**：
1. `opening_hours`: 營業時間與國定假日公告 (06:00 - 24:00)
2. `address_transit`: 場館地址與大眾運輸交通指引 (台北市大安區忠孝東路四段 888 號)
3. `gym_rules`: 入場服裝、室內運動鞋、禁止摔槓與毛巾自備規定
4. `equipment`: 四大核心重訓、心肺與草皮功能性訓練設施
5. `parking`: 特約地下停車場 2 小時免費折抵與機車停車位
6. `contact_info`: 客服電話 (02) 2778-9898、官方 LINE@ 與緊急專線
7. `lockers_showers`: 免費密碼單次置物櫃、月租置物櫃與乾濕分離淋浴間
8. `pt_booking_policy`: 私人教練課預約、24 小時前請假與 FMS 檢測
9. `group_classes_policy`: 團體課程預約、候補與 No-Show 規範
10. `nutrition_and_beverages`: 逆滲透飲水機、乳清蛋白機與補給站

---

### 2. `gym_services`（服務方案與收費表）
收錄 18 筆完整會籍方案、私人教練課、團體課程與加值項目（超越題目至少 15 筆的要求）。

| 欄位名稱 (Column) | 資料型態 (Type) | 約束 (Constraint) | 說明 (Description) |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | 主鍵流水號 |
| `service_code` | TEXT | UNIQUE NOT NULL | 方案代碼（如 `MEM-001`, `PT-001`, `GRP-001`） |
| `name` | TEXT | NOT NULL | 服務或課程名稱 |
| `category` | TEXT | NOT NULL | 服務類別（會籍方案 / 私人教練 / 團體課程 / 加值服務） |
| `price` | INTEGER | NOT NULL | 價格（新台幣 NT$） |
| `unit` | TEXT | NOT NULL | 計價單位（次 / 月 / 季 / 半年 / 年 / 堂 / 套） |
| `availability` | TEXT | NOT NULL | 供售狀態（供售中 / 名額充裕 / 需提前預約 / 即將額滿） |
| `description` | TEXT | NULL | 方案權益與詳細描述 |
| `duration_minutes`| INTEGER | DEFAULT 0 | 單堂課程時間分鐘數 |

---

### 3. `human_handoff_tickets`（真人轉接客訴工單表）
由 `human_handoff` 工具即時寫入，紀錄客訴、退費爭議或特殊需求。

| 欄位名稱 (Column) | 資料型態 (Type) | 約束 (Constraint) | 說明 (Description) |
|---|---|---|---|
| `ticket_id` | TEXT | PRIMARY KEY | 工單單號（如 `TICK-20261024-8921`） |
| `customer_name` | TEXT | NOT NULL | 顧客尊稱或姓名 |
| `contact_phone` | TEXT | NOT NULL | 聯絡電話 |
| `issue_category`| TEXT | NOT NULL | 問題類別（客訴抱怨 / 退費爭議 / 未收錄資訊 等） |
| `issue_description` | TEXT | NOT NULL | 具體狀況描述 |
| `urgency` | TEXT | NOT NULL | 緊急程度 (`urgent` 15分鐘回電 / `normal` 當日回電) |
| `created_at` | TEXT | NOT NULL | 建立時間戳記 (ISO 8601) |
| `status` | TEXT | NOT NULL | 處理狀態 (`pending` / `processing` / `resolved`) |

---

## 🛠️ 四大 Callable Tools 規格說明

後端透過 `@google/genai` 定義 4 個 Function Declaration，並在 Agent Loop 中執行：

### 1. `lookup_gym_info`（場館事實檢索）
- **功能**：查詢營業時間、地址、停車優惠、設施配備、淋浴置物櫃與各項館內規章。
- **輸入參數**：
  - `query` (string, 必填)：搜尋關鍵字（如「停車」、「營業時間」、「摔槓」、「毛巾」）。
  - `topic` (string, 選填)：指定主題代碼。
- **後端實作**：執行參數化 SQL `SELECT ... FROM gym_info WHERE (title LIKE ? OR content LIKE ? OR keywords LIKE ?) LIMIT 5`。

### 2. `lookup_gym_services`（方案與價格檢索）
- **功能**：查詢會籍方案、私人教練課（單堂/十堂/二十堂）、團課（飛輪/瑜珈/HIIT/拳擊/TRX）價格與名額。
- **輸入參數**：
  - `category` (string, 選填)：類別（'會籍方案'、'私人教練'、'團體課程'、'加值服務'）。
  - `query` (string, 選填)：搜尋關鍵字。
  - `max_price` (number, 選填)：預算上限金額。
- **後端實作**：執行參數化 SQL `SELECT ... FROM gym_services WHERE ... ORDER BY price ASC`。

### 3. `calculate_membership_cost`（會籍費用精算引擎）
- **功能**：依據購買月數、學生身分、置物櫃加租與優惠碼精算費用。**嚴禁 AI 進行心算估價**。
- **輸入參數**：
  - `months` (integer, 必填)：購買月數（≥ 1）。
  - `is_student` (boolean, 必填)：是否為在學學生。
  - `include_locker` (boolean, 選填)：是否加租私人置物櫃。
  - `coupon_code` (string, 選填)：折扣碼（輸入 `APEX2026` 折抵 $200）。

### 4. `human_handoff`（真人專員轉接）
- **功能**：客訴、退費糾紛、強烈不滿或詢問未收錄業務時，建立正式處理工單。
- **輸入參數**：
  - `customer_name` (string, 必填)：顧客尊稱。
  - `contact_phone` (string, 必填)：聯絡電話。
  - `issue_category` (string, 必填)：問題類別。
  - `issue_description` (string, 必填)：事件詳情。
  - `urgency` (string, 選填)：'urgent' 或 'normal'。
- **後端實作**：將工單寫入 `human_handoff_tickets`，生成唯一單號，回傳承諾回電時限與專線。

---

## 🧮 會籍計費演算法公式推導 (Calculation Formula)

```
基礎費率常數：
• 基礎單月會籍費 (P_base) = NT$ 1,288 / 月
• 標準入會手續費 (F_reg)  = NT$ 1,000
• 置物櫃月租費   (L_fee)  = NT$ 300 / 月

1. 會期階梯折扣率 (R_duration)：
   • 1 ≤ months < 6   → R_duration = 1.0 (無折扣)
   • 6 ≤ months < 12  → R_duration = 0.9 (半年繳享 9 折)
   • months ≥ 12      → R_duration = 0.8 (年度會籍享 8 折特惠)

2. 學生身分加碼折扣 (R_student)：
   • 若 is_student == true  → R_student = 0.95 (學生身分月費再享 95 折)
   • 否則                   → R_student = 1.0

3. 入會費減免規則 (F_effective)：
   • 若 (months ≥ 12 或 is_student == true) → F_effective = NT$ 0 (免收入會費)
   • 否則                                   → F_effective = NT$ 1,000

4. 置物櫃加租費用 (L_total)：
   • 若 include_locker == true → L_total = 300 × months
   • 否則                      → L_total = 0

5. 優惠代碼折抵 (D_coupon)：
   • 若 coupon_code == 'APEX2026' → D_coupon = NT$ 200
   • 否則                         → D_coupon = 0

★ 最終應收總金額公式 (Total)：
Total = ⌊ 1,288 × months × R_duration × R_student ⌋ + F_effective + L_total - D_coupon
```

---

## 🧪 10 題工具選擇自動化評估題庫 (10 Test Cases)

| 編號 | 測試問句 | 預期調用工具 | 驗證目標 |
|---|---|---|---|
| **#1** | 「請問 ApexFit 平日和週末的營業時間是幾點到幾點？」 | `lookup_gym_info` | 營業時間事實查詢 |
| **#2** | 「開車去你們健身房有特約停車場可以折抵停車費嗎？」 | `lookup_gym_info` | 停車與交通優惠查詢 |
| **#3** | 「我想知道一對一私人教練單堂課與十堂課各是多少錢？」 | `lookup_gym_services` | 教練課收費清單查詢 |
| **#4** | 「你們有開拳擊或飛輪的團體課程嗎？費用多少？」 | `lookup_gym_services` | 團體課程費用與名額 |
| **#5** | 「我是大學生，如果買一年的健身房會籍，總共要算多少錢？」 | `calculate_membership_cost` | 年繳8折免入會費+學生95折精算 |
| **#6** | 「我想辦半年會籍，另外加租置物櫃，這樣總共多少錢？」 | `calculate_membership_cost` | 半年9折+置物櫃加購試算 |
| **#7** | 「今天置物櫃門鎖壞掉害我被反鎖，櫃檯態度很差，我要找主管投訴！姓名陳大華，電話 0912-345-678」 | `human_handoff` | 嚴重客訴真人立案轉接 |
| **#8** | 「請問你們館內有幼兒托育或寵物寄放服務嗎？」 | `lookup_gym_info` | 未收錄業務之檢索與指引 |
| **#9** | 「請幫我算 3 個月非學生、不加置物櫃的入會費用？輸入折扣碼 APEX2026」 | `calculate_membership_cost` | 標準費率+折扣碼折抵精算 |
| **#10**| 「請問入館運動需要自備毛巾嗎？有沒有服裝鞋子規範？」 | `lookup_gym_info` | 場館衛生與穿著規則查詢 |

---

## 🚀 如何在本機運行與測試 (How to Run and Test)

### 1. 安裝環境依賴
確保已安裝 Node.js (v18+)：
```bash
npm install
```

### 2. 設定環境變數 (.env)
複製 `.env.example` 為 `.env`，並填入 Gemini API 金鑰：
```bash
cp .env.example .env
```
在 `.env` 中設定：
```env
GEMINI_API_KEY="AIzaSy..."
PORT=3000
```
*(注意：提交至 GitHub 時，`.gitignore` 已自動排除 `.env`，嚴禁外洩真實密鑰！)*

### 3. 啟動開發伺服器
```bash
npm run dev
```
啟動後，開啟瀏覽器造訪 `http://localhost:3000`：
- 後端伺服器會自動讀取 `data/seeds/gym_info.csv` 與 `data/seeds/gym_services.csv`，初始化 SQLite 資料庫。
- 前端支援 5 大功能分頁：
  1. **💬 智能客服**：發送問題並展開即時「🛠️ 工具調用歷程」。
  2. **🧮 會籍試算**：可自由調整月數、學生身分與置物櫃，直接體驗後端計費公式。
  3. **📊 SQLite 資料庫**：即時檢視 `gym_info`、`gym_services` 與 `human_handoff_tickets` 資料表。
  4. **🧪 10 題工具評估**：點擊「執行全部 10 題測試評估」，自動統計 Pass/Fail 與通過率。
  5. **📖 專題架構說明**：展示完整的專案架構、演算法推導與操作文件。

### 4. 執行代碼檢查與建置驗證
```bash
npm run lint    # 執行 TypeScript 靜態型別檢驗 (tsc --noEmit)
npm run build   # 建置正式環境前端 bundle
```

---

## 📂 專案檔案結構清單 (Project Structure)

```
.
├── data/
│   └── seeds/
│       ├── gym_info.csv          # 10 筆場館資訊種子資料
│       └── gym_services.csv      # 18 筆會籍與課程收費種子資料
├── server/
│   ├── db.ts                     # SQLite 資料庫初始化、CSV 匯入與參數化查詢
│   ├── tools.ts                  # 4 大 Callable Tools 定義與後端執行引擎
│   ├── agent.ts                  # Gemini SDK 整合、5 步 Agent Loop 與歷程蒐集
│   └── testSuite.ts              # 10 題標準自動化測試執行器
├── src/
│   ├── components/
│   │   ├── Navbar.tsx            # 符規 Top Bar 導航列
│   │   ├── ChatView.tsx          # 聊天主介面與示範問題
│   │   ├── TraceCard.tsx         # 工具調用歷程 (Tool Execution Trace) 渲染器
│   │   ├── CalculatorWidget.tsx  # 會籍收費試算互動小工具
│   │   ├── DatabaseView.tsx      # SQLite 資料庫三表瀏覽器
│   │   ├── TestSuiteView.tsx     # 10 題工具選擇自動測試評估面板
│   │   └── ProjectReportView.tsx # 專案架構、公式推導與評分說明面板
│   ├── App.tsx                   # 前端主入口整合
│   ├── types.ts                  # 共享 TypeScript 型別介面
│   ├── main.tsx                  # React 19 掛載點
│   └── index.css                 # Tailwind CSS 樣式
├── .env.example                  # 環境變數範本檔 (無真實密鑰)
├── .gitignore                    # Git 忽略設定 (.env, node_modules, *.sqlite)
├── metadata.json                 # AI Studio 應用元數據
├── package.json                  # 專案依賴與啟動腳本
├── server.ts                     # Full-Stack Express 伺服器主入口
├── tsconfig.json                 # TypeScript 配置檔
└── README.md                     # 本專題成果報告文件
```

---

## 授權與宣告 (License)
本專案為學校作業專題作品，全數使用真實後端架構與參數化查詢，代碼乾淨簡練，適合學習與展示。
