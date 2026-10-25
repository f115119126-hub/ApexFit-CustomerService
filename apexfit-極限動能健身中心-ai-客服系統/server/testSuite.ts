import type { Database } from 'sql.js';
import { runAgentConversation } from './agent.ts';

export interface TestCase {
  id: number;
  question: string;
  expectedTool: 'lookup_gym_info' | 'lookup_gym_services' | 'calculate_membership_cost' | 'human_handoff';
  description: string;
  category: '場館資訊' | '服務收費' | '費用試算' | '真人轉接';
}

export interface TestResult {
  id: number;
  question: string;
  expectedTool: string;
  actualTools: string[];
  passed: boolean;
  reply: string;
  executionTimeMs: number;
  tracesCount: number;
}

export const STANDARD_TEST_CASES: TestCase[] = [
  {
    id: 1,
    question: '請問 ApexFit 平日和週末的營業時間是幾點到幾點？',
    expectedTool: 'get_info',
    description: '測試營業時間之靜態事實查詢 (get_info)',
    category: '場館資訊',
  },
  {
    id: 2,
    question: '開車去你們健身房有特約停車場可以折抵停車費嗎？',
    expectedTool: 'get_info',
    description: '測試停車場與會員優惠查詢 (get_info)',
    category: '場館資訊',
  },
  {
    id: 3,
    question: '我想知道一對一私人教練單堂課與十堂課各是多少錢？',
    expectedTool: 'search_records',
    description: '測試教練課程之價格清單查詢 (search_records)',
    category: '服務收費',
  },
  {
    id: 4,
    question: '你們有開拳擊或飛輪的團體課程嗎？費用多少？',
    expectedTool: 'search_records',
    description: '測試團體課程價格與名額查詢 (search_records)',
    category: '服務收費',
  },
  {
    id: 5,
    question: '我是大學生，如果買一年的健身房會籍，總共要算多少錢？',
    expectedTool: 'calculate_membership_cost',
    description: '測試年繳 8 折免入會費 + 學生 95 折之精確演算法計算 (calculate_membership_cost)',
    category: '費用試算',
  },
  {
    id: 6,
    question: '我想辦半年會籍，另外加租置物櫃，這樣總共多少錢？',
    expectedTool: 'calculate_membership_cost',
    description: '測試半年 9 折 + 置物櫃加購之精確費用試算 (calculate_membership_cost)',
    category: '費用試算',
  },
  {
    id: 7,
    question: '今天置物櫃門鎖壞掉害我被反鎖，櫃檯態度很差，我要找主管投訴！姓名陳大華，電話 0912-345-678',
    expectedTool: 'transfer_to_human',
    description: '測試嚴重客訴與櫃檯爭議轉接真人專員立案 (transfer_to_human)',
    category: '真人轉接',
  },
  {
    id: 8,
    question: '請問你們館內有幼兒托育或寵物寄放服務嗎？',
    expectedTool: 'get_info',
    description: '測試未收錄或特殊業務之檢索與合宜引導 (get_info)',
    category: '場館資訊',
  },
  {
    id: 9,
    question: '請幫我算 3 個月非學生、不加置物櫃的入會費用？輸入折扣碼 APEX2026',
    expectedTool: 'calculate_membership_cost',
    description: '測試標準月費 + 入會費 + 優惠碼折抵之精確試算 (calculate_membership_cost)',
    category: '費用試算',
  },
  {
    id: 10,
    question: '請問入館運動需要自備毛巾嗎？有沒有服裝鞋子規範？',
    expectedTool: 'get_info',
    description: '測試場館衛生、毛巾規範與穿著要求查詢 (get_info)',
    category: '場館資訊',
  },
];

export async function runSingleTest(db: Database, testCase: TestCase): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const result = await runAgentConversation(db, testCase.question, []);
    const actualTools = result.traces.map((t) => t.toolName);

    // 支援別名兼容判定
    const isToolMatch = (actual: string, expected: string) => {
      if (actual === expected) return true;
      if (expected === 'get_info' && actual === 'lookup_gym_info') return true;
      if (expected === 'search_records' && actual === 'lookup_gym_services') return true;
      if (expected === 'transfer_to_human' && actual === 'human_handoff') return true;
      return false;
    };

    const passed = actualTools.some((t) => isToolMatch(t, testCase.expectedTool));

    return {
      id: testCase.id,
      question: testCase.question,
      expectedTool: testCase.expectedTool,
      actualTools,
      passed,
      reply: result.reply,
      executionTimeMs: Date.now() - startTime,
      tracesCount: result.traces.length,
    };
  } catch (err: any) {
    return {
      id: testCase.id,
      question: testCase.question,
      expectedTool: testCase.expectedTool,
      actualTools: [],
      passed: false,
      reply: `測試執行失敗: ${err.message || String(err)}`,
      executionTimeMs: Date.now() - startTime,
      tracesCount: 0,
    };
  }
}

export async function runAllStandardTests(db: Database): Promise<{
  summary: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    totalTimeMs: number;
  };
  results: TestResult[];
}> {
  const startTime = Date.now();
  const results: TestResult[] = [];

  for (const tc of STANDARD_TEST_CASES) {
    const res = await runSingleTest(db, tc);
    results.push(res);
  }

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  return {
    summary: {
      total,
      passed,
      failed: total - passed,
      passRate,
      totalTimeMs: Date.now() - startTime,
    },
    results,
  };
}
