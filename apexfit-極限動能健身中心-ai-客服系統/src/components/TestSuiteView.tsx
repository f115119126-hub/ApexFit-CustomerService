import React, { useState, useEffect } from 'react';
import type { TestCase, TestResult, TestSuiteSummary } from '../types.ts';
import { CheckCircle2, XCircle, Play, RotateCcw, Clock, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

export const TestSuiteView: React.FC = () => {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [results, setResults] = useState<Record<number, TestResult>>({});
  const [summary, setSummary] = useState<TestSuiteSummary | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [runningId, setRunningId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/tests/cases')
      .then((res) => res.json())
      .then((data) => setTestCases(data.testCases || []))
      .catch((err) => console.error('無法載入測試清單:', err));
  }, []);

  const handleRunSingle = async (testCase: TestCase) => {
    setRunningId(testCase.id);
    try {
      const res = await fetch('/api/tests/run-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: testCase.id }),
      });
      const data: TestResult = await res.json();
      setResults((prev) => ({ ...prev, [testCase.id]: data }));
    } catch (err) {
      console.error('單題測試失敗:', err);
    } finally {
      setRunningId(null);
    }
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    try {
      const res = await fetch('/api/tests/run-all', {
        method: 'POST',
      });
      const data = await res.json();
      const resMap: Record<number, TestResult> = {};
      data.results.forEach((r: TestResult) => {
        resMap[r.id] = r;
      });
      setResults(resMap);
      setSummary(data.summary);
    } catch (err) {
      console.error('批次測試執行失敗:', err);
    } finally {
      setIsRunningAll(false);
    }
  };

  const computedPassed = Object.values(results).filter((r) => r.passed).length;
  const computedTotalTested = Object.values(results).length;
  const computedPassRate =
    computedTotalTested > 0 ? Math.round((computedPassed / computedTotalTested) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 頁面標題 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>學校專題評估套件 · 10 道標準測試案例</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            工具選擇精準度自動化驗證面板
          </h1>
          <p className="text-xs text-slate-400">
            逐一發送標準測試問句給 Gemini Agent，驗證 AI 是否精確選擇預期的 Callable Tool 並杜絕無端臆測。
          </p>
        </div>

        {/* 執行按鈕群 */}
        <div className="flex gap-2">
          <button
            onClick={handleRunAll}
            disabled={isRunningAll}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 disabled:opacity-50 transition-all shadow-md shadow-amber-400/20 whitespace-nowrap"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunningAll ? 'animate-spin' : ''}`} />
            <span>{isRunningAll ? '全題型驗證中 (需數秒)...' : '執行全部 10 題測試評估'}</span>
          </button>
        </div>
      </div>

      {/* 統計指標 KPI 卡片列 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">總測試題目</div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {testCases.length} 題
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">已完成題數</div>
          <div className="text-2xl font-bold font-mono text-slate-200 tabular-nums">
            {computedTotalTested} / {testCases.length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-emerald-400 font-medium">通過數量 (Pass)</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {computedPassed} 題
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-amber-400 font-medium">通過率 (Pass Rate)</div>
          <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
            {computedPassRate}%
          </div>
        </div>
      </div>

      {/* 10 題測試列表 */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th className="py-3 px-3 w-12 text-center">編號</th>
                <th className="py-3 px-3 w-28">分類</th>
                <th className="py-3 px-4">測試提問內容</th>
                <th className="py-3 px-3 w-44">預期調用工具</th>
                <th className="py-3 px-3 w-40">實際調用工具</th>
                <th className="py-3 px-3 w-24 text-center">驗證結果</th>
                <th className="py-3 px-3 w-24 text-right">執行操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {testCases.map((tc) => {
                const res = results[tc.id];
                const isRunning = runningId === tc.id;
                const isExpanded = expandedId === tc.id;

                return (
                  <React.Fragment key={tc.id}>
                    <tr className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-400 tabular-nums">
                        #{tc.id}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-300 font-medium">{tc.category}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-100">{tc.question}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{tc.description}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-amber-400">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                          {tc.expectedTool}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        {res ? (
                          res.actualTools.length > 0 ? (
                            res.actualTools.map((t, idx) => (
                              <span
                                key={idx}
                                className={`inline-block mr-1 px-1.5 py-0.5 rounded ${
                                  t === tc.expectedTool
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}
                              >
                                {t}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500">未調用任何工具</span>
                          )
                        ) : (
                          <span className="text-slate-600">尚未執行</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {res ? (
                          res.passed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              PASS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              <XCircle className="w-3 h-3" />
                              FAIL
                            </span>
                          )
                        ) : (
                          <span className="text-slate-600 text-[11px]">待驗證</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {res && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : tc.id)}
                              className="p-1 rounded text-slate-400 hover:text-white"
                              title="展開檢視回覆內容"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleRunSingle(tc)}
                            disabled={isRunning || isRunningAll}
                            className="px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors disabled:opacity-40"
                          >
                            {isRunning ? '驗證中...' : '單題執行'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* 展開之 AI 回覆與耗時細節 */}
                    {isExpanded && res && (
                      <tr className="bg-slate-900/90 text-slate-300">
                        <td colSpan={7} className="p-4 border-t border-slate-800/80">
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center text-slate-400">
                              <span className="font-semibold text-white">
                                AI 回覆內容 (包含工具檢索結果轉述):
                              </span>
                              <span className="font-mono text-[11px]">
                                耗時: {res.executionTimeMs} ms · 工具調用數: {res.tracesCount}
                              </span>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 whitespace-pre-wrap leading-relaxed text-slate-200">
                              {res.reply}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
