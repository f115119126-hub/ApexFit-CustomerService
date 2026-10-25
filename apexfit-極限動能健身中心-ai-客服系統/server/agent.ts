import { GoogleGenAI } from '@google/genai';
import type { Database } from 'sql.js';
import { allToolDeclarations, executeToolCall, type ToolExecutionRecord } from './tools.ts';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_INSTRUCTION = `
你是由「ApexFit 極限動能健身中心」官方所開發的專屬 AI 智能客服助理。
請務必嚴格遵守以下所有核心準則：

1. 【語言規範】：一律使用台灣繁體中文 (Traditional Chinese / zh-TW) 親切、專業地回答。
2. 【工具調用與零幻覺原則（最高指導方針）】：
   - 你不可自行憑空捏造、猜測或心算任何場館營業時間、收費、排班、價格或規範。
   - 凡詢問營業時間、地址、交通、停車、淋浴、置物櫃、毛巾服裝規定等場館規範，必須調用「get_info」。
   - 凡詢問健身方案、私人教練課費用、團課（飛輪/瑜珈/拳擊等）或教練是否有空檔，必須調用「search_records」。
   - 凡詢問會籍費用試算、學生優惠、半年繳或年繳、加租置物櫃或折扣代碼，必須調用「calculate_membership_cost」，嚴禁自行心算！
   - 凡遇到客訴、抱怨、退費爭議、合約糾紛或需要真人專員時，必須立即調用「transfer_to_human」為顧客立案產生工單編號（即使顧客尚未提供姓名電話，亦請先呼叫此工具建立工單，再向顧客告知工單編號並索取後續聯繫資料）。
3. 【資料不存在之嚴格處置】：
   - 若工具回傳查無資料（如詢問「明天某位教練有沒有空」、「托育服務」等未收錄項目），你必須在回答中明確說明：「目前資料庫沒有這項資訊」，並說明館內目前僅有教練課程方案與預約規定，未收錄個別教練明天之即時空檔排班，不可自行編造！
4. 【回覆清晰度】：忠實轉述工具回傳的事實數據與計算明細，格式整齊、條理分明。
`;

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export interface AgentResult {
  reply: string;
  traces: ToolExecutionRecord[];
  stepsCount: number;
}

export async function runAgentConversation(
  db: Database,
  userMessage: string,
  history: ChatMessage[] = []
): Promise<AgentResult> {
  const traces: ToolExecutionRecord[] = [];
  const MAX_AGENT_STEPS = 5; // 限制 Agent 迴圈最高步數以防止死循環
  let stepsCount = 0;

  // 格式化對話歷史供 Gemini 使用
  const formattedContents: any[] = [];

  for (const msg of history) {
    if (msg.role === 'user') {
      formattedContents.push({
        role: 'user',
        parts: [{ text: msg.content }],
      });
    } else if (msg.role === 'model') {
      formattedContents.push({
        role: 'model',
        parts: [{ text: msg.content }],
      });
    }
  }

  // 加入當前使用者的輸入
  formattedContents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  let finalReply = '';

  while (stepsCount < MAX_AGENT_STEPS) {
    stepsCount++;

    // 優先使用高效能且支援 function calling 的 gemini-3.5-flash，備援 gemini-3.5-flash-lite
    let response: any = null;
    const candidateModels = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: formattedContents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations: allToolDeclarations }],
            temperature: 0.2,
          },
        });
        if (response) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Agent] 調用 ${modelName} 失敗:`, err?.message || err);
      }
    }

    if (!response) {
      // 若模型遭遇 API 錯誤，依規格立即停止並以中文回覆，絕不無限轉圈
      finalReply = `⚠️ 系統目前無法連線至 AI 引擎：${lastError?.message || '模型無回應'}。若有急需，請直接致電 ApexFit 官方客服專線 (02) 2778-9898。`;
      break;
    }

    const candidate = response.candidates?.[0];
    const functionCalls = response.functionCalls;

    // 若模型決定呼叫工具
    if (functionCalls && functionCalls.length > 0) {
      // 將模型含有 functionCall 的內容存回對話歷史
      if (candidate?.content) {
        formattedContents.push(candidate.content);
      }

      // 執行所有被觸發的工具
      const toolResponseParts: any[] = [];

      for (const call of functionCalls) {
        if (!call.name) continue;
        console.log(`[Agent Step ${stepsCount}] 正在執行工具: ${call.name}`, call.args);
        try {
          const { result, record } = await executeToolCall(db, call.name, (call.args as Record<string, any>) || {});
          traces.push(record);

          toolResponseParts.push({
            functionResponse: {
              name: call.name,
              response: { output: result },
            },
          });
        } catch (toolErr: any) {
          console.error(`工具 ${call.name} 執行失敗:`, toolErr);
          const errorRecord: ToolExecutionRecord = {
            toolName: call.name,
            args: call.args || {},
            result: { error: toolErr?.message || String(toolErr) },
            executionTimeMs: 0,
            sqlOrFormula: 'Error during tool execution',
          };
          traces.push(errorRecord);
          toolResponseParts.push({
            functionResponse: {
              name: call.name,
              response: { error: `工具執行失敗: ${toolErr?.message || toolErr}` },
            },
          });
        }
      }

      // 將工具執行結果以 user 角色送回模型進行下一步思考
      formattedContents.push({
        role: 'user',
        parts: toolResponseParts,
      });

      // 繼續下一輪迴圈讓模型解讀結果或產出最終回覆
    } else {
      // 模型給出了最終文字答案
      finalReply = response.text || '感謝您的詢問，ApexFit 為您服務！';
      break;
    }
  }

  // 若達到最大 5 步限制尚未結束，停止並用中文回覆
  if (!finalReply) {
    if (traces.length > 0) {
      finalReply = '已達到最大處理步數限制（5 步）。已為您完成主要工具檢索與計算，詳細資料請參閱上方的工具執行歷程 (Tool Execution Trace)。如需進一步協助，歡迎轉接真人專員。';
    } else {
      finalReply = '已達到最大對話推理步數限制，未能取得完整回應。如需協助請隨時聯繫現場櫃檯 (02) 2778-9898。';
    }
  }

  return {
    reply: finalReply,
    traces,
    stepsCount,
  };
}
