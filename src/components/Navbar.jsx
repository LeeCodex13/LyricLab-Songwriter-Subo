import React from 'react';
import {
  Droplets,
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Smartphone,
  Receipt,
  BarChart3,
  Settings,
  Calendar
} from 'lucide-react';
import { formatPeriodKey } from '../utils/formatters';

export default function Navbar({
  activeTab,
  setActiveTab,
  currentPeriod,
  setCurrentPeriod,
  periods,
  onOpenSettings,
  orgName
}) {
  const navItems = [
    { id: 'dashboard', label: 'ภาพรวมระบบ', icon: LayoutDashboard },
    { id: 'users', label: 'ทะเบียนผู้ใช้น้ำ', icon: Users },
    { id: 'meter', label: 'จดมิเตอร์น้ำ', icon: FileSpreadsheet },
    { id: 'mobile-meter', label: 'โหมดเดินจดสนาม', icon: Smartphone, highlight: true },
    { id: 'bills', label: 'ออกบิล & รับชำระ', icon: Receipt },
    { id: 'reports', label: 'รายงาน & หนี้ค้าง', icon: BarChart3 },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm no-print">
      {/* Top Banner / Org info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Droplets className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-800 tracking-tight">Smart WaterWorks</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-medium">ระบบประปา</span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-[280px] sm:max-w-md">
                {orgName || 'กองการประปา เทศบาลตำบลน้ำใสเจริญ'}
              </p>
            </div>
          </div>

          {/* Controls: Period Selector & Settings */}
          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="flex items-center bg-slate-100 hover:bg-slate-200/80 transition-colors rounded-lg px-2.5 py-1.5 border border-slate-200">
              <Calendar className="w-4 h-4 text-sky-600 mr-2 shrink-0" />
              <div className="text-xs text-slate-500 mr-1.5 hidden sm:inline">รอบบิล:</div>
              <select
                value={currentPeriod}
                onChange={(e) => setCurrentPeriod(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                {periods.map((p) => (
                  <option key={p.period_key} value={p.period_key}>
                    {formatPeriodKey(p.period_key)}
                  </option>
                ))}
              </select>
            </div>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors border border-slate-200"
              title="ตั้งค่าระบบและอัตราค่าน้ำ"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none border-t border-slate-100 pt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                    : item.highlight
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-emerald-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full uppercase tracking-wider font-bold">
                    Mobile
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
