import React, { useState } from 'react';
import { Navbar, type ActiveTab } from './components/Navbar.tsx';
import { ChatView } from './components/ChatView.tsx';
import { CalculatorWidget } from './components/CalculatorWidget.tsx';
import { DatabaseView } from './components/DatabaseView.tsx';
import { TestSuiteView } from './components/TestSuiteView.tsx';
import { ProjectReportView } from './components/ProjectReportView.tsx';
import type { ChatMessage } from './types.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const initialWelcomeMessage: ChatMessage = {
    id: 'welcome-msg-1',
    role: 'model',
    content: `您好！歡迎光臨【ApexFit 極限動能健身中心】智能客服專線！💪

我是您的官方 AI 健身助理，已即時連接場館 SQLite 資料庫。您可以向我詢問：
• 🏢 **場館資訊**：營業時間、捷運與公車交通、特約停車場折抵、淋浴與置物櫃
• 💳 **收費與課程**：單月/季/年繳會籍、一對一私人教練課、飛輪/瑜珈/HIIT/拳擊團課
• 🧮 **費用精算**：學生專屬優惠試算、半年繳 9 折、年繳 8 折免入會費精算
• 👨‍💼 **專人服務**：客訴投訴、合約退費或特殊需求，為您立案安排專員回電

請問今天有什麼我可以為您服務的呢？`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcomeMessage]);

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 構建傳送給後端的歷史記錄格式
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || '伺服器處理對話時發生錯誤');
      }

      const data = await res.json();

      const modelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.reply || '已為您完成資訊查詢。',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        traces: data.traces || [],
        stepsCount: data.stepsCount,
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error('發送訊息失敗:', err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'model',
        content: `⚠️ 很抱歉，伺服器暫時無法連線或執行發生問題：${
          err.message || String(err)
        }。如遇緊急事項，請隨時撥打 ApexFit 總櫃檯專線：(02) 2778-9898。`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        ...initialWelcomeMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setActiveTab('chat');
  };

  const handleAskWithCalculation = (promptText: string) => {
    setActiveTab('chat');
    handleSendMessage(promptText);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onNewChat={handleNewChat}
      />

      <main className="flex-1">
        {activeTab === 'chat' && (
          <ChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onClearChat={handleNewChat}
          />
        )}

        {activeTab === 'calculator' && (
          <CalculatorWidget onAskChatWithCalculation={handleAskWithCalculation} />
        )}

        {activeTab === 'database' && <DatabaseView />}

        {activeTab === 'testsuite' && <TestSuiteView />}

        {activeTab === 'report' && <ProjectReportView />}
      </main>
    </div>
  );
}
