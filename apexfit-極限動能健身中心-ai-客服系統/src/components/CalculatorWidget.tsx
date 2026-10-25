import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRight, Check, Sparkles, Tag, ShieldCheck, Flame } from 'lucide-react';

interface CalculatorWidgetProps {
  onAskChatWithCalculation?: (promptText: string) => void;
}

export const CalculatorWidget: React.FC<CalculatorWidgetProps> = ({ onAskChatWithCalculation }) => {
  const [months, setMonths] = useState<number>(12);
  const [isStudent, setIsStudent] = useState<boolean>(true);
  const [includeLocker, setIncludeLocker] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState<string>('APEX2026');
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchCalculation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/calculator/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          months,
          is_student: isStudent,
          include_locker: includeLocker,
          coupon_code: couponCode,
        }),
      });
      const data = await res.json();
      setCalculationResult(data.result);
    } catch (err) {
      console.error('計費失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalculation();
  }, [months, isStudent, includeLocker, couponCode]);

  const handleSendToChat = () => {
    if (!onAskChatWithCalculation) return;
    const prompt = `我想諮詢會籍方案：我打算辦理 ${months} 個月會籍，${
      isStudent ? '我是學生（有學生證）' : '非學生身分'
    }，${includeLocker ? '需要加租置物櫃' : '不需置物櫃'}${
      couponCode ? `，折扣碼輸入 ${couponCode}` : ''
    }。請幫我說明試算細節與會員權益！`;
    onAskChatWithCalculation(prompt);
  };

  const bd = calculationResult?.breakdown;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* 標題區 */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
          <Calculator className="w-3.5 h-3.5" />
          <span>純後端演算法引擎 · 絕無 AI 心算幻覺</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          ApexFit 會籍收費與階梯優惠試算器
        </h1>
        <p className="text-sm text-slate-400">
          公式規則：基礎月費 NT$ 1,288/月，標準入會費 NT$ 1,000。半年享 9 折、年繳享 8 折免入會費；學生憑證享免入會費並加贈月費 95 折。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左側：控制參數表單 */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span>試算參數設定</span>
          </h2>

          {/* 會期月數選擇 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-300 font-medium">會期月數 (Duration):</label>
              <span className="font-mono text-amber-400 font-bold text-sm tabular-nums">
                {months} 個月
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="24"
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex gap-2 pt-1">
              {[1, 3, 6, 12, 24].map((m) => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  className={`flex-1 py-1.5 text-xs rounded-lg font-mono transition-colors ${
                    months === m
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 12 ? '1年 (8折)' : m === 6 ? '半年 (9折)' : `${m}月`}
                </button>
              ))}
            </div>
          </div>

          {/* 在學學生身分 Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium text-white flex items-center gap-1.5">
                <span>在學學生專屬身分</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.2 rounded font-mono">
                  免入會費 + 95折
                </span>
              </div>
              <p className="text-xs text-slate-400">需出示國內外大專院校有效學生證</p>
            </div>
            <button
              onClick={() => setIsStudent(!isStudent)}
              className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                isStudent ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
            </button>
          </div>

          {/* 加租專屬私人置物櫃 Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium text-white">加租專屬置物櫃</div>
              <p className="text-xs text-slate-400">獨立固定電子密碼鎖櫃位 (NT$ 300 / 月)</p>
            </div>
            <button
              onClick={() => setIncludeLocker(!includeLocker)}
              className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                includeLocker ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
            </button>
          </div>

          {/* 折扣代碼輸入 */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium flex items-center justify-between">
              <span>優惠折扣碼 (Coupon Code):</span>
              <span className="text-[11px] text-amber-400 cursor-pointer hover:underline" onClick={() => setCouponCode('APEX2026')}>
                填入 APEX2026 (立折 $200)
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="例如：APEX2026"
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
              <Tag className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
            </div>
          </div>
        </div>

        {/* 右側：精算明細結果卡片 */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 flex flex-col justify-between space-y-6 shadow-lg shadow-amber-500/5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                收費清單明細 (Itemized Breakdown)
              </span>
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                後端即時演算
              </span>
            </div>

            {bd && (
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">原始基底月費總計 ({bd.months} 個月 × $1,288)</span>
                  <span className="font-mono tabular-nums text-slate-200">
                    NT$ {bd.rawMonthlySubtotal?.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">會期階梯折扣 ({bd.durationDiscountLabel})</span>
                  <span className="font-mono tabular-nums text-amber-400">
                    {bd.durationDiscountRate < 1 ? `折抵 ${(1 - bd.durationDiscountRate) * 100}%` : '無折扣'}
                  </span>
                </div>

                {bd.isStudent && (
                  <div className="flex justify-between py-1 border-b border-slate-800/60 text-sky-400">
                    <span>學生身分加碼專屬優惠</span>
                    <span className="font-mono tabular-nums">再享 95 折 (5% OFF)</span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">折扣後月費小計</span>
                  <span className="font-mono tabular-nums font-semibold text-white">
                    NT$ {bd.discountedMonthlyTotal?.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <div>
                    <span className="text-slate-400">入會手續費 (Registration Fee)</span>
                    <div className="text-[10px] text-slate-500">{bd.registrationFeeNote}</div>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-white">
                    NT$ {bd.registrationFeeCharged?.toLocaleString()}
                  </span>
                </div>

                {bd.includeLocker && (
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">專屬置物櫃月租 ({bd.months} 個月 × $300)</span>
                    <span className="font-mono tabular-nums text-slate-200">
                      NT$ {bd.lockerTotal?.toLocaleString()}
                    </span>
                  </div>
                )}

                {bd.couponDiscount > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-800/60 text-orange-400">
                    <span>{bd.couponNote}</span>
                    <span className="font-mono tabular-nums font-semibold">
                      - NT$ {bd.couponDiscount}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 總計金額大字展現 */}
            {bd && (
              <div className="pt-2 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-slate-400">最終應繳總額</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tabular-nums">
                    NT$ {bd.finalTotal?.toLocaleString()}
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>平均每月花費約：</span>
                  <span className="text-white font-mono font-medium tabular-nums">
                    NT$ {bd.averageMonthlyCost?.toLocaleString()} / 月
                  </span>
                </div>

                {bd.totalSavings > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      本方案累計為您省下：
                    </span>
                    <span className="font-mono tabular-nums">
                      NT$ {bd.totalSavings?.toLocaleString()} 元
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 傳送到客服按鈕 */}
          <button
            onClick={handleSendToChat}
            className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-400/20"
          >
            <span>帶入此試算向智能客服諮詢</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
