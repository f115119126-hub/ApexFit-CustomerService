import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, ToolTrace } from '../types.ts';
import { TraceCard } from './TraceCard.tsx';
import { Send, Bot, User, Sparkles, AlertCircle, RefreshCw, MapPin, Clock, Phone, ShieldCheck } from 'lucide-react';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  onClearChat: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onClearChat,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');
    onSendMessage(text);
  };

  const samplePrompts = [
    {
      category: '場館資訊 (get_info)',
      text: '營業時間是幾點？',
    },
    {
      category: '費用精算 (calculate_membership_cost)',
      text: '我是學生，買一年會籍加置物櫃要多少錢？',
    },
    {
      category: '服務查詢 (search_records)',
      text: '我想知道明天某位教練有沒有空。',
    },
    {
      category: '真人客服 (transfer_to_human)',
      text: '我要客訴並申請退費。',
    },
    {
      category: '場館資訊 (get_info)',
      text: '開車去你們健身房有特約停車場可以折抵停車費嗎？',
    },
    {
      category: '服務查詢 (search_records)',
      text: '我想知道一對一私人教練單堂課與十堂課各是多少錢？',
    },
    {
      category: '服務查詢 (search_records)',
      text: '你們有開拳擊或飛輪的團體課程嗎？費用多少？',
    },
    {
      category: '費用精算 (calculate_membership_cost)',
      text: '請幫我算 3 個月非學生、不加置物櫃的入會費用？輸入折扣碼 APEX2026',
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto px-3 sm:px-6 py-4">
      {/* 頂部場館簡介橫幅 */}
      <div className="mb-3 p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 text-xs text-slate-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">ApexFit 極限動能智能客服中心</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              官方伺服器連線中
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[11px] flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              06:00 - 24:00
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-sky-400" />
              台北市大安區忠孝東路四段 888 號
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-orange-400" />
              (02) 2778-9898
            </span>
          </div>
        </div>
      </div>

      {/* 訊息聊天清單區域 */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
              <Bot className="w-7 h-7" />
            </div>

            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-bold text-white">您好！我是 ApexFit 智能客服助理</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                我已連線至健身房 SQLite 資料庫，能為您即時查詢營業資訊、教練團課價格、精算各類會籍與優惠，或為您轉接專員服務。
              </p>
            </div>

            {/* 快速示範問題清單 */}
            <div className="w-full max-w-2xl text-left space-y-3 pt-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>點擊快速測試 4 大工具調用情境：</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {samplePrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(item.text)}
                    className="p-3 text-left rounded-lg bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 transition-all group"
                  >
                    <div className="text-[11px] text-amber-400/90 font-medium mb-1">
                      {item.category}
                    </div>
                    <div className="text-xs text-slate-200 group-hover:text-white line-clamp-2">
                      {item.text}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-amber-500 text-slate-950 font-medium ml-auto'
                    : 'bg-slate-900 border border-slate-800 text-slate-200'
                }`}
              >
                {/* 訊息主體文字 */}
                <div className="whitespace-pre-wrap leading-relaxed space-y-1">
                  {msg.content}
                </div>

                {/* 工具調用歷程 Trace */}
                {msg.traces && msg.traces.length > 0 && (
                  <div className="mt-2 text-slate-100">
                    <TraceCard traces={msg.traces} />
                  </div>
                )}

                <div
                  className={`text-[10px] mt-1.5 font-mono ${
                    msg.role === 'user' ? 'text-slate-900/70 text-right' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* 思考與工具執行中指示器 */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 text-xs flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
              <span>AI 正在分析意圖並調用後端工具檢索資料庫...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 底部輸入區域 */}
      <div className="pt-3 border-t border-slate-800/80">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="請輸入您的問題（例如：營業時間、教練課價格、大一生算一年會籍、或客訴反應）..."
            rows={1}
            disabled={isLoading}
            className="w-full resize-none rounded-xl bg-slate-900 border border-slate-700/80 px-4 py-3 pr-24 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all disabled:opacity-50"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={onClearChat}
                title="清空聊天記錄"
                className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2 rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 disabled:opacity-40 disabled:hover:bg-amber-400 transition-all shadow-sm shadow-amber-400/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1.5">
          <span>支援 Shift + Enter 換行 · 系統具備最大 5 步 Agent Loop 防護</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            參數化 SQL 查詢保護
          </span>
        </div>
      </div>
    </div>
  );
};
