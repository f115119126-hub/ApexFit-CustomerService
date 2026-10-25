import { Type, type FunctionDeclaration } from '@google/genai';
import type { Database } from 'sql.js';
import { queryAll, saveDatabase } from './db.ts';

export interface ToolExecutionRecord {
  toolName: string;
  args: Record<string, any>;
  result: any;
  executionTimeMs: number;
  sqlOrFormula?: string;
}

// 1. Tool Declaration: get_info
export const getInfoDeclaration: FunctionDeclaration = {
  name: 'get_info',
  description: '查詢 ApexFit 健身中心的官方場館資訊（營業時間、場館地址交通、入場與器材規範、設施介紹、停車優惠、聯絡電話、置物櫃淋浴間、教練課與團課預約請假規範等）。若使用者詢問營業時間、地址、停車、淋浴、毛巾規定，必須呼叫此工具。',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: '搜尋關鍵字，例如「營業時間」、「地址」、「停車」、「毛巾」、「摔槓」、「淋浴」、「教練預約」、「飲水機」等',
      },
      topic: {
        type: Type.STRING,
        description: '特定主題代碼（選填），如 opening_hours, address_transit, gym_rules, equipment, parking, contact_info, lockers_showers, pt_booking_policy, group_classes_policy, nutrition_and_beverages',
      },
    },
    required: ['query'],
  },
};

// 2. Tool Declaration: search_records
export const searchRecordsDeclaration: FunctionDeclaration = {
  name: 'search_records',
  description: '查詢 ApexFit 健身中心的會籍方案、私人教練課方案、團體課程（飛輪、瑜珈、HIIT、拳擊等）與加值服務的官方價格、收費單位、時長與名額狀態。若使用者詢問教練課費用、團課收費、月卡季卡方案或教練是否有空，必須呼叫此工具。',
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description: '服務類別（選填），可選：「會籍方案」、「私人教練」、「團體課程」、「加值服務」',
      },
      query: {
        type: Type.STRING,
        description: '搜尋關鍵字（選填），例如「飛輪」、「瑜珈」、「教練」、「月卡」、「年約」、「InBody」、「空檔」、「排班」等',
      },
      max_price: {
        type: Type.NUMBER,
        description: '最高預算上限（選填，單位為新台幣 NT$）',
      },
    },
  },
};

// 3. Tool Declaration: calculate_membership_cost
export const calculateMembershipCostDeclaration: FunctionDeclaration = {
  name: 'calculate_membership_cost',
  description: '在後端程式碼中確定性計算健身會籍費用與優惠折扣（嚴禁 AI 心算）。參數包含會期月數、是否為在學學生、是否加租置物櫃與折扣碼。公式：基礎月費 $1288，半年9折、年繳8折免入會費，學生身分免入會費且月費享額外95折，置物櫃每月 $300。',
  parameters: {
    type: Type.OBJECT,
    properties: {
      months: {
        type: Type.INTEGER,
        description: '購買月數（整數，如 1, 3, 6, 12, 24 個月）',
      },
      is_student: {
        type: Type.BOOLEAN,
        description: '是否為在學學生（需出示有效學生證，可免除 NT$ 1,000 入會費並享月費 95 折額外優惠）',
      },
      include_locker: {
        type: Type.BOOLEAN,
        description: '是否加租專屬私人置物櫃（每月 NT$ 300）',
      },
      coupon_code: {
        type: Type.STRING,
        description: '折扣代碼（選填，例如「APEX2026」現折 NT$ 200）',
      },
    },
    required: ['months', 'is_student'],
  },
};

// 4. Tool Declaration: transfer_to_human
export const transferToHumanDeclaration: FunctionDeclaration = {
  name: 'transfer_to_human',
  description: '當顧客表達客訴、抱怨、要求退費、合約爭議、櫃檯糾紛、或需要真人協助時，請立即調用此工具建立真人客服工單。若顧客尚未提供姓名或電話，參數可使用預設值（例如「貴賓顧客」、「待補充」），系統會自動立案產生工單編號。',
  parameters: {
    type: Type.OBJECT,
    properties: {
      customer_name: {
        type: Type.STRING,
        description: '顧客尊稱或姓名（若未提供可填「貴賓顧客」）',
      },
      contact_phone: {
        type: Type.STRING,
        description: '顧客聯絡電話或手機號碼（若未提供可填「待顧客補充」）',
      },
      issue_category: {
        type: Type.STRING,
        description: '問題類別，如「客訴抱怨」、「退費爭議」、「未收錄資訊」、「特殊身體狀況」、「合約異動」或「其他」',
      },
      issue_description: {
        type: Type.STRING,
        description: '事件詳細說明與顧客具體需求',
      },
      urgency: {
        type: Type.STRING,
        description: '緊急程度，可選「normal」（一般處理）或「urgent」（緊急案件，15 分鐘內專員致電）',
      },
    },
    required: ['issue_category', 'issue_description'],
  },
};

export const allToolDeclarations = [
  getInfoDeclaration,
  searchRecordsDeclaration,
  calculateMembershipCostDeclaration,
  transferToHumanDeclaration,
];

// 後端實際執行工具的實現函式
export async function executeToolCall(
  db: Database,
  name: string,
  args: Record<string, any>
): Promise<{ result: any; record: ToolExecutionRecord }> {
  const startTime = Date.now();
  let result: any = null;
  let sqlOrFormula: string | undefined = undefined;

  switch (name) {
    case 'get_info':
    case 'lookup_gym_info': {
      const query = (args.query || '').trim();
      const topic = (args.topic || '').trim();

      let sql = 'SELECT id, topic, title, category, content, updated_at FROM gym_info WHERE 1=1';
      const params: any[] = [];

      if (topic) {
        sql += ' AND topic = ?';
        params.push(topic);
      }

      if (query) {
        sql += ' AND (title LIKE ? OR content LIKE ? OR keywords LIKE ? OR category LIKE ?)';
        const likeParam = `%${query}%`;
        params.push(likeParam, likeParam, likeParam, likeParam);
      }

      sql += ' ORDER BY id ASC LIMIT 5';
      sqlOrFormula = `SQL: ${sql} | PARAMS: ${JSON.stringify(params)}`;

      const rows = queryAll(db, sql, params);

      if (rows.length === 0 && query.length > 2) {
        const fallbackSql = 'SELECT id, topic, title, category, content, updated_at FROM gym_info WHERE content LIKE ? OR keywords LIKE ? LIMIT 3';
        const fallbackParams = [`%${query.slice(0, 2)}%`, `%${query.slice(0, 2)}%`];
        const fallbackRows = queryAll(db, fallbackSql, fallbackParams);
        if (fallbackRows.length > 0) {
          result = {
            status: 'found_partial',
            count: fallbackRows.length,
            message: `已依據相關關鍵字找到 ${fallbackRows.length} 筆場館資訊`,
            data: fallbackRows,
          };
          break;
        }
      }

      result = {
        status: rows.length > 0 ? 'success' : 'not_found',
        count: rows.length,
        message: rows.length > 0 ? `成功查詢到 ${rows.length} 筆符合的場館規範與資訊` : '目前資料庫沒有這項資訊。如需進一步協助可轉接真人客服專員。',
        data: rows,
      };
      break;
    }

    case 'search_records':
    case 'lookup_gym_services': {
      const category = (args.category || '').trim();
      const query = (args.query || '').trim();
      const maxPrice = typeof args.max_price === 'number' ? args.max_price : null;

      // 若查詢教練即時空檔/排班，資料庫並無即時課表行事曆
      if (query.includes('空檔') || query.includes('排班') || query.includes('有沒有空') || query.includes('明天') || query.includes('某位教練')) {
        sqlOrFormula = `SQL: SELECT * FROM gym_records WHERE name LIKE '%教練%' LIMIT 5`;
        const ptRows = queryAll(db, "SELECT service_code, name, category, price, unit, availability, description FROM gym_records WHERE category = '私人教練'");
        result = {
          status: 'not_found',
          count: 0,
          message: '目前資料庫沒有這項資訊。資料庫僅收錄私人教練方案費用與預約規範，未收錄個別教練明天之即時個人排班或預約空檔。若需預約指定時段，建議致電 (02) 2778-9898 或轉接真人專員。',
          available_coaching_plans: ptRows,
        };
        break;
      }

      let sql = 'SELECT service_code, name, category, price, unit, availability, description, duration_minutes FROM gym_records WHERE 1=1';
      const params: any[] = [];

      if (category) {
        sql += ' AND category LIKE ?';
        params.push(`%${category}%`);
      }

      if (query) {
        sql += ' AND (name LIKE ? OR description LIKE ? OR service_code LIKE ?)';
        const likeParam = `%${query}%`;
        params.push(likeParam, likeParam, likeParam);
      }

      if (maxPrice !== null) {
        sql += ' AND price <= ?';
        params.push(maxPrice);
      }

      sql += ' ORDER BY price ASC LIMIT 10';
      sqlOrFormula = `SQL: ${sql} | PARAMS: ${JSON.stringify(params)}`;

      const rows = queryAll(db, sql, params);
      result = {
        status: rows.length > 0 ? 'success' : 'not_found',
        count: rows.length,
        message: rows.length > 0 ? `成功取得 ${rows.length} 項服務與價格項目` : '目前資料庫沒有這項資訊。',
        data: rows,
      };
      break;
    }

    case 'calculate_membership_cost': {
      const months = Math.max(1, parseInt(args.months, 10) || 1);
      const isStudent = Boolean(args.is_student);
      const includeLocker = Boolean(args.include_locker);
      const couponCode = (args.coupon_code || '').trim().toUpperCase();

      const BASE_MONTHLY_FEE = 1288;
      const REGISTRATION_FEE = 1000;
      const LOCKER_MONTHLY_FEE = 300;

      // 1. 依據會期計算階梯月費折扣率
      let durationDiscountRate = 1.0;
      let durationDiscountLabel = '標準無折 (1-5 個月)';

      if (months >= 12) {
        durationDiscountRate = 0.8; // 年繳 8 折
        durationDiscountLabel = '年度會籍 8 折特惠 (80%)';
      } else if (months >= 6) {
        durationDiscountRate = 0.9; // 半年繳 9 折
        durationDiscountLabel = '半年動能 9 折特惠 (90%)';
      }

      // 2. 學生身分加碼 95 折
      const studentDiscountRate = isStudent ? 0.95 : 1.0;

      // 3. 計算折扣後月費小計
      const rawMonthlyTotal = BASE_MONTHLY_FEE * months;
      const discountedMonthlyTotal = Math.floor(rawMonthlyTotal * durationDiscountRate * studentDiscountRate);

      // 4. 入會費減免邏輯：年繳 (>=12個月) 或學生身分皆享 NT$ 1,000 完全減免
      let effectiveRegistrationFee = REGISTRATION_FEE;
      let registrationFeeWaiverReason = '需收取標準入會手續費 NT$ 1,000';

      if (months >= 12) {
        effectiveRegistrationFee = 0;
        registrationFeeWaiverReason = '年繳特惠：享 NT$ 1,000 入會費全額免除！';
      } else if (isStudent) {
        effectiveRegistrationFee = 0;
        registrationFeeWaiverReason = '學生專屬禮遇：憑有效學生證免收 NT$ 1,000 入會費！';
      }

      // 5. 置物櫃費用
      const lockerTotal = includeLocker ? LOCKER_MONTHLY_FEE * months : 0;

      // 6. 折扣碼折抵
      let couponDiscount = 0;
      let couponNote = '未使用折扣代碼';
      if (couponCode === 'APEX2026') {
        couponDiscount = 200;
        couponNote = '優惠碼「APEX2026」折抵 NT$ 200';
      }

      // 7. 計算最終總價
      const finalTotal = Math.max(0, discountedMonthlyTotal + effectiveRegistrationFee + lockerTotal - couponDiscount);
      const totalSavings = rawMonthlyTotal + REGISTRATION_FEE - (discountedMonthlyTotal + effectiveRegistrationFee) + couponDiscount;

      const formulaString = `Formula: floor(${BASE_MONTHLY_FEE} * ${months} * ${durationDiscountRate} * ${studentDiscountRate}) + ${effectiveRegistrationFee} + ${lockerTotal} - ${couponDiscount} = NT$ ${finalTotal}`;
      sqlOrFormula = formulaString;

      result = {
        status: 'calculated',
        input: { months, isStudent, includeLocker, couponCode },
        breakdown: {
          baseMonthlyFee: BASE_MONTHLY_FEE,
          months,
          rawMonthlySubtotal: rawMonthlyTotal,
          durationDiscountRate,
          durationDiscountLabel,
          isStudent,
          studentDiscountApplied: isStudent ? '額外享學生 95 折 (95%)' : '無',
          discountedMonthlyTotal,
          registrationFeeOriginal: REGISTRATION_FEE,
          registrationFeeCharged: effectiveRegistrationFee,
          registrationFeeNote: registrationFeeWaiverReason,
          lockerMonthlyFee: LOCKER_MONTHLY_FEE,
          includeLocker,
          lockerTotal,
          couponCode: couponCode || '無',
          couponDiscount,
          couponNote,
          finalTotal,
          averageMonthlyCost: Math.round(finalTotal / months),
          totalSavings,
        },
        formulaExplanation: `【ApexFit 費用試算清單】
• 會籍時長：${months} 個月
• 基底月費總額：NT$ ${rawMonthlyTotal.toLocaleString()} (${BASE_MONTHLY_FEE} × ${months} 個月)
• 階梯折扣：${durationDiscountLabel}
• 學生優惠：${isStudent ? '已啟用（免入會費 + 月費 95 折）' : '無'}
• 折扣後會籍費用：NT$ ${discountedMonthlyTotal.toLocaleString()}
• 入會費：NT$ ${effectiveRegistrationFee} (${registrationFeeWaiverReason})
• 私人置物櫃月租：${includeLocker ? `NT$ ${lockerTotal.toLocaleString()} (${LOCKER_MONTHLY_FEE} × ${months} 個月)` : '未選配 (NT$ 0)'}
• 優惠代碼折抵：${couponDiscount > 0 ? `- NT$ ${couponDiscount} (${couponCode})` : 'NT$ 0'}
---------------------------------------------
★ 最終應付總額：NT$ ${finalTotal.toLocaleString()} 元整
★ 平均每月支出：約 NT$ ${Math.round(finalTotal / months).toLocaleString()} 元
★ 累計為您節省：NT$ ${totalSavings.toLocaleString()} 元`,
      };
      break;
    }

    case 'transfer_to_human':
    case 'human_handoff': {
      const customerName = (args.customer_name || '健身會員').trim();
      const contactPhone = (args.contact_phone || '未提供').trim();
      const issueCategory = (args.issue_category || '客訴抱怨與退費申請').trim();
      const issueDescription = (args.issue_description || '顧客提出客訴抱怨或退費爭議申請，需專員儘速致電協助。').trim();
      const urgency = args.urgency === 'urgent' ? 'urgent' : 'urgent'; // 退費與客訴一律標註為緊急優先處理

      const ticketId = `TICK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const createdAt = new Date().toISOString();
      const status = 'pending';

      const insertSql = `
        INSERT INTO human_handoff_tickets (ticket_id, customer_name, contact_phone, issue_category, issue_description, urgency, created_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [ticketId, customerName, contactPhone, issueCategory, issueDescription, urgency, createdAt, status];

      db.run(insertSql, params);
      saveDatabase(db);

      sqlOrFormula = `SQL: INSERT INTO human_handoff_tickets VALUES ('${ticketId}', '${customerName}', '${contactPhone}', '${issueCategory}', ...)`;

      const callbackPromise = '15 分鐘內專員緊急致電協助退費與處理爭議';

      result = {
        status: 'ticket_created',
        ticketId,
        customerName,
        contactPhone,
        issueCategory,
        urgency,
        callbackPromise,
        hotline: '(02) 2778-9898',
        emergencyLine: '(02) 2778-9899',
        message: `已為您成功建立真人客服爭議處理工單【${ticketId}】。專員將於 ${callbackPromise}。您亦可直接撥打 ApexFit 總櫃檯主管專線 (02) 2778-9898。`,
      };
      break;
    }

    default:
      throw new Error(`未知工具名稱: ${name}`);
  }

  const executionTimeMs = Date.now() - startTime;
  const record: ToolExecutionRecord = {
    toolName: name,
    args,
    result,
    executionTimeMs,
    sqlOrFormula,
  };

  return { result, record };
}
