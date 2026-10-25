import React from 'react';
import { Dumbbell, MessageSquare, Calculator, Database, CheckCircle2, BookOpen } from 'lucide-react';

export type ActiveTab = 'chat' | 'calculator' | 'database' | 'testsuite' | 'report';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onNewChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, onNewChat }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer" onClick={() => onTabChange('chat')}>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-slate-950 shadow-md shadow-orange-500/20 font-bold">
            <Dumbbell className="w-5 h-5 text-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              ApexFit <span className="text-amber-400 font-medium text-sm">極限動能</span>
            </span>
          </div>
        </div>

        {/* Zone 2: Clean Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onTabChange('chat')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'chat'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>智能客服</span>
          </button>

          <button
            onClick={() => onTabChange('calculator')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'calculator'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>會籍試算</span>
          </button>

          <button
            onClick={() => onTabChange('database')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'database'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>SQLite 資料庫</span>
          </button>

          <button
            onClick={() => onTabChange('testsuite')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'testsuite'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>10 題工具評估</span>
          </button>

          <button
            onClick={() => onTabChange('report')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'report'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>專題架構說明</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onNewChat}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm shadow-amber-400/20 transition-all whitespace-nowrap shrink-0"
          >
            開啟新對話
          </button>
        </div>
      </div>
    </header>
  );
};
