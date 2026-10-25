import React, { useState, useEffect } from 'react';
import type { GymInfoRow, GymServiceRow, TicketRow } from '../types.ts';
import { Database, Search, RefreshCw, Layers, ShieldCheck, Tag, Info, Calendar, DollarSign } from 'lucide-react';

export const DatabaseView: React.FC = () => {
  const [activeTable, setActiveTable] = useState<'info' | 'services' | 'tickets'>('info');
  const [infoRows, setInfoRows] = useState<GymInfoRow[]>([]);
  const [serviceRows, setServiceRows] = useState<GymServiceRow[]>([]);
  const [ticketRows, setTicketRows] = useState<TicketRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [resInfo, resServices, resTickets] = await Promise.all([
        fetch('/api/db/info'),
        fetch('/api/db/services'),
        fetch('/api/db/tickets'),
      ]);
      const dataInfo = await resInfo.json();
      const dataServices = await resServices.json();
      const dataTickets = await resTickets.json();

      setInfoRows(dataInfo.data || []);
      setServiceRows(dataServices.data || []);
      setTicketRows(dataTickets.data || []);
    } catch (err) {
      console.error('取得資料庫資料失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const filteredInfo = infoRows.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServices = serviceRows.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.service_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTickets = ticketRows.filter(
    (r) =>
      r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.issue_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.issue_description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 標題與簡介 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-md border border-sky-500/20">
            <Database className="w-3.5 h-3.5" />
            <span>SQLite 關聯式資料庫結構與實體資料</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            ApexFit 系統資料表瀏覽器
          </h1>
          <p className="text-xs text-slate-400">
            包含場館規範表 (gym_info: 10 類主題)、課程與收費表 (gym_services: 18 筆項目) 及客服工單表。全數支援參數化查詢。
          </p>
        </div>

        <button
          onClick={fetchAllData}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
          <span>重新載入資料庫</span>
        </button>
      </div>

      {/* 資料表切換分頁與搜尋列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTable('info')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTable === 'info'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>gym_info 場館資訊表 ({infoRows.length})</span>
          </button>

          <button
            onClick={() => setActiveTable('services')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTable === 'services'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>gym_records 課程與會籍表 ({serviceRows.length})</span>
          </button>

          <button
            onClick={() => setActiveTable('tickets')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTable === 'tickets'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>真人轉接工單 ({ticketRows.length})</span>
          </button>
        </div>

        {/* 搜尋框 */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋關鍵字或代碼..."
            className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 pl-8 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* 資料表內容 */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-sm">
        {activeTable === 'info' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-3 px-3 w-12">ID</th>
                  <th className="py-3 px-3 w-36">主題代碼 (topic)</th>
                  <th className="py-3 px-3 w-36">標題 (title)</th>
                  <th className="py-3 px-3 w-28">分類 (category)</th>
                  <th className="py-3 px-4">詳細內容 (content)</th>
                  <th className="py-3 px-3 w-36">搜尋關鍵字 (keywords)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {filteredInfo.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      查無匹配資料
                    </td>
                  </tr>
                ) : (
                  filteredInfo.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400 tabular-nums">{row.id}</td>
                      <td className="py-3 px-3 font-mono text-amber-400">{row.topic}</td>
                      <td className="py-3 px-3 font-semibold text-white">{row.title}</td>
                      <td className="py-3 px-3">
                        <span className="text-slate-300">{row.category}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 leading-relaxed max-w-md">{row.content}</td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">{row.keywords}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTable === 'services' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-3 px-3 w-24">服務編號</th>
                  <th className="py-3 px-4">服務/方案名稱</th>
                  <th className="py-3 px-3 w-24">類別</th>
                  <th className="py-3 px-3 w-28 text-right">費用 (NT$)</th>
                  <th className="py-3 px-3 w-20 text-center">計費單位</th>
                  <th className="py-3 px-3 w-24 text-center">名額狀態</th>
                  <th className="py-3 px-4">權益與詳細描述</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      查無匹配資料
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-3 font-mono text-amber-400">{row.service_code}</td>
                      <td className="py-3 px-4 font-semibold text-white">{row.name}</td>
                      <td className="py-3 px-3 text-slate-300">{row.category}</td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-400 text-right tabular-nums">
                        ${row.price.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">{row.unit}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[11px] px-2 py-0.5 rounded border ${
                          row.availability === '供售中' || row.availability === '名額充裕'
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                            : 'text-orange-400 bg-orange-500/10 border-orange-500/30'
                        }`}>
                          {row.availability}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 leading-relaxed max-w-sm">{row.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTable === 'tickets' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-3 px-3 w-36">工單單號</th>
                  <th className="py-3 px-3 w-28">顧客姓名</th>
                  <th className="py-3 px-3 w-32">聯絡電話</th>
                  <th className="py-3 px-3 w-28">問題類別</th>
                  <th className="py-3 px-4">狀況說明</th>
                  <th className="py-3 px-24 w-20 text-center">緊急度</th>
                  <th className="py-3 px-3 w-24 text-center">處理狀態</th>
                  <th className="py-3 px-3 w-36">建立時間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      目前無真人轉接工單紀錄（可於聊天室發送客訴測試建立工單）
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((row) => (
                    <tr key={row.ticket_id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-3 font-mono text-rose-400">{row.ticket_id}</td>
                      <td className="py-3 px-3 font-semibold text-white">{row.customer_name}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{row.contact_phone}</td>
                      <td className="py-3 px-3 text-slate-300">{row.issue_category}</td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs">{row.issue_description}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          row.urgency === 'urgent' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {row.urgency === 'urgent' ? '緊急 (15分內)' : '一般'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
