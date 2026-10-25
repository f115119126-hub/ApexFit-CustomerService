import React, { useState } from 'react';
import type { ToolTrace } from '../types.ts';
import { Wrench, ChevronDown, ChevronUp, Clock, Database, Terminal, CheckCircle2 } from 'lucide-react';

interface TraceCardProps {
  traces: ToolTrace[];
}

export const TraceCard: React.FC<TraceCardProps> = ({ traces }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0);

  if (!traces || traces.length === 0) return null;

  const currentTrace = traces[activeTab] || traces[0];

  const getToolBadgeColor = (name: string) => {
    switch (name) {
      case 'get_info':
      case 'lookup_gym_info':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
      case 'search_records':
      case 'lookup_gym_services':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'calculate_membership_cost':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'transfer_to_human':
      case 'human_handoff':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getToolDisplayName = (name: string) => {
    switch (name) {
      case 'get_info':
      case 'lookup_gym_info':
        return '場館靜態資料庫檢索 (get_info)';
      case 'search_records':
      case 'lookup_gym_services':
        return '服務與價格清單檢索 (search_records)';
      case 'calculate_membership_cost':
        return '會籍費用確定性精算 (calculate_membership_cost)';
      case 'transfer_to_human':
      case 'human_handoff':
        return '真人專員工單轉接 (transfer_to_human)';
      default:
        return name;
    }
  };

  return (
    <div className="my-2.5 rounded-xl border border-slate-700/80 bg-slate-900/90 overflow-hidden shadow-sm">
      {/* 摘要列 */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3.5 py-2.5 bg-slate-800/60 hover:bg-slate-800 transition-colors flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>工具調用歷程 (Tool Execution Trace)</span>
          </div>

          <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-slate-700 text-slate-200">
            {traces.length} 次調用
          </span>

          <div className="flex items-center gap-1.5">
            {traces.map((t, idx) => (
              <span
                key={idx}
                className={`text-[11px] px-2 py-0.5 rounded border font-mono ${getToolBadgeColor(t.toolName)}`}
              >
                {t.toolName}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1 font-mono tabular-nums text-[11px]">
            <Clock className="w-3 h-3 text-slate-500" />
            {traces.reduce((acc, cur) => acc + cur.executionTimeMs, 0)} ms
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* 展開之完整詳細資訊 */}
      {isExpanded && (
        <div className="p-3.5 border-t border-slate-800 text-xs space-y-3 bg-slate-950/60">
          {/* 若有多個工具調用，提供切換分頁 */}
          {traces.length > 1 && (
            <div className="flex gap-1.5 border-b border-slate-800 pb-2">
              {traces.map((trace, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    activeTab === idx
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  #{idx + 1} {trace.toolName}
                </button>
              ))}
            </div>
          )}

          {/* 當前選中的工具詳細面板 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {getToolDisplayName(currentTrace.toolName)}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                耗時: {currentTrace.executionTimeMs} ms
              </span>
            </div>

            {/* 呼叫參數 Arguments */}
            <div>
              <div className="text-slate-400 text-[11px] font-medium mb-1 flex items-center gap-1">
                <Terminal className="w-3 h-3 text-amber-400" />
                <span>傳入引數 (Arguments):</span>
              </div>
              <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto">
                {JSON.stringify(currentTrace.args, null, 2)}
              </pre>
            </div>

            {/* 後端執行的 SQL 或計算公式 */}
            {currentTrace.sqlOrFormula && (
              <div>
                <div className="text-slate-400 text-[11px] font-medium mb-1 flex items-center gap-1">
                  <Database className="w-3 h-3 text-sky-400" />
                  <span>後端處理引擎 (SQL / Formula):</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-sky-300 font-mono text-[11px] break-all">
                  {currentTrace.sqlOrFormula}
                </div>
              </div>
            )}

            {/* 工具回傳結果 Results */}
            <div>
              <div className="text-slate-400 text-[11px] font-medium mb-1">
                回傳事實數據 (Execution Output):
              </div>
              <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300/90 font-mono text-[11px] max-h-48 overflow-y-auto overflow-x-auto">
                {JSON.stringify(currentTrace.result, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
