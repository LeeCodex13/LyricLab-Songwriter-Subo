import React from 'react';
import {
  Users,
  Droplets,
  Coins,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  UserPlus,
  FileSpreadsheet,
  Receipt,
  Search,
  ExternalLink,
  Info
} from 'lucide-react';
import {
  formatCurrency,
  formatNumber,
  formatPeriodKey,
  formatPeriodKeyShort,
  CATEGORY_LABELS
} from '../utils/formatters';

export default function Dashboard({
  data,
  currentPeriod,
  onNavigateTab,
  onAddUser,
  onSelectUserForDetail,
  onRefresh
}) {
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Droplets className="w-10 h-10 text-sky-500 animate-bounce mx-auto mb-2" />
          <p className="text-slate-500 text-sm">กำลังโหลดข้อมูลภาพรวมระบบ...</p>
        </div>
      </div>
    );
  }

  const { users, readings, financials, anomalies, historicalTrends, categoryBreakdown, recentLogs } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Action */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-cyan-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-32 -top-10 w-36 h-36 bg-cyan-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>รอบประจำเดือน: {formatPeriodKey(currentPeriod)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              ระบบจัดเก็บข้อมูลผู้ใช้น้ำและการประปา
            </h1>
            <p className="text-sky-100 text-sm mt-1 max-w-xl">
              จัดการข้อมูลผู้ใช้น้ำ อ่านมิเตอร์ ออกใบแจ้งหนี้พร้อม PromptPay QR Code และติดตามยอดค้างชำระแบบครบวงจร
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('meter')}
              className="flex items-center gap-2 bg-white text-sky-800 hover:bg-sky-50 font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all text-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-sky-600" />
              <span>จดมิเตอร์เดือนนี้</span>
            </button>
            <button
              onClick={onAddUser}
              className="flex items-center gap-2 bg-sky-500/40 hover:bg-sky-500/60 text-white font-medium px-4 py-2.5 rounded-xl backdrop-blur-sm border border-white/20 transition-all text-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ เพิ่มผู้ใช้น้ำ</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Users */}
        <div
          onClick={() => onNavigateTab('users')}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ผู้ใช้น้ำทั้งหมด</span>
            <div className="w-10 h-10 rounded-lg bg-sky-50 group-hover:bg-sky-100 text-sky-600 flex items-center justify-center transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-800">{formatNumber(users?.total || 0)}</span>
            <span className="text-xs text-slate-500">ราย</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              ปกติ {users?.active || 0}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-amber-600 font-medium">ระงับ {users?.suspended || 0}</span>
          </div>
        </div>

        {/* Card 2: Meter Reading Progress */}
        <div
          onClick={() => onNavigateTab('meter')}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ความคืบหน้าจดมิเตอร์</span>
            <div className="w-10 h-10 rounded-lg bg-cyan-50 group-hover:bg-cyan-100 text-cyan-600 flex items-center justify-center transition-colors">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-800">{readings?.completionPercent || 0}%</span>
            <span className="text-xs text-slate-500">
              ({readings?.recordedCount || 0} / {users?.active || 0})
            </span>
          </div>
          {/* Progress Bar */}
          <div className="mt-3 pt-2 border-t border-slate-100">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, readings?.completionPercent || 0)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
              <span>ยังไม่จด {users?.unrecordedInPeriod || 0} หลัง</span>
              <span className="text-sky-600 font-medium group-hover:underline">เปิดบันทึก →</span>
            </div>
          </div>
        </div>

        {/* Card 3: Water Consumption */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ปริมาณการใช้น้ำรอบนี้</span>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-800">{formatNumber(readings?.totalUnits || 0)}</span>
            <span className="text-xs text-slate-500">ลบ.ม. (คิว)</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>เฉลี่ยต่อหลังคาเรือน:</span>
            <span className="font-semibold text-slate-700">
              {readings?.recordedCount > 0 ? (readings.totalUnits / readings.recordedCount).toFixed(1) : 0} ลบ.ม.
            </span>
          </div>
        </div>

        {/* Card 4: Financial Collection */}
        <div
          onClick={() => onNavigateTab('bills')}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ยอดเรียกเก็บประจำรอบ</span>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-800">
              {formatNumber(financials?.totalBilled || 0, 2)}
            </span>
            <span className="text-xs text-slate-500">บาท</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-emerald-700 font-medium">
              เก็บแล้ว: {formatNumber(financials?.totalCollected || 0, 0)} บ. ({financials?.collectionRate || 0}%)
            </span>
            <span className="text-amber-700 font-medium">
              ค้าง: {formatNumber(financials?.totalUnpaid || 0, 0)} บ.
            </span>
          </div>
        </div>
      </div>

      {/* Anomaly Alerts Section (if any high usage or meter issue) */}
      {anomalies && anomalies.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 text-sm">
                ตรวจพบความผิดปกติในการใช้น้ำรอบนี้ ({anomalies.length} รายการ)
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                มีผู้ใช้น้ำที่ใช้น้ำสูงผิดปกติหรือมิเตอร์ไม่หมุน ควรตรวจสอบท่อรั่วหรือหน้าปัดมิเตอร์
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {anomalies.map((anom) => (
                  <div
                    key={anom.id}
                    onClick={() => onSelectUserForDetail(anom.user_id)}
                    className="bg-white/80 hover:bg-white p-2.5 rounded-lg border border-amber-200 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{anom.user_name}</span>
                        <span className="text-[10px] text-slate-500 font-normal">({anom.user_code})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        บ้านเลขที่ {anom.house_no} • {anom.zone}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                        {anom.units_used} หน่วย
                      </span>
                      <span className="block text-[10px] text-amber-800 font-medium">
                        {anom.anomaly_flag === 'high_usage' ? 'ท่อรั่ว?' : '0 หน่วย'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 6-Month Historical Trends (Bars) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-base text-slate-800">สถิติการใช้น้ำและรายรับ 6 เดือนย้อนหลัง</h2>
              <p className="text-xs text-slate-500">เปรียบเทียบปริมาณน้ำที่จำหน่าย (ลบ.ม.) และยอดเงินที่จัดเก็บได้</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium">
              ย้อนหลัง 6 รอบบิล
            </span>
          </div>

          {/* Custom SVG Bar Chart */}
          {historicalTrends && historicalTrends.length > 0 ? (
            <div className="pt-4">
              <div className="h-56 flex items-end justify-between gap-2 sm:gap-6 px-2 sm:px-4 border-b border-slate-200 pb-2">
                {(() => {
                  const maxUnits = Math.max(...historicalTrends.map((t) => t.total_units || 0), 10);
                  const maxRevenue = Math.max(...historicalTrends.map((t) => t.billed_amount || 0), 100);

                  return historicalTrends.map((item, idx) => {
                    const unitHeight = Math.max(10, Math.round((item.total_units / maxUnits) * 160));
                    const revHeight = Math.max(10, Math.round((item.billed_amount / maxRevenue) * 160));

                    return (
                      <div key={item.period_key} className="flex-1 flex flex-col items-center gap-1 group">
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] rounded px-2 py-1 absolute -translate-y-24 pointer-events-none shadow-lg z-20 whitespace-nowrap">
                          <p className="font-bold">{formatPeriodKey(item.period_key)}</p>
                          <p>ใช้น้ำ: {formatNumber(item.total_units)} คิว</p>
                          <p>ยอดเงิน: {formatNumber(item.billed_amount, 2)} บ.</p>
                          <p>เก็บได้: {formatNumber(item.collected_amount, 2)} บ.</p>
                        </div>

                        {/* Side by side bars */}
                        <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-44">
                          {/* Unit usage bar */}
                          <div
                            style={{ height: `${unitHeight}px` }}
                            className="w-1/2 max-w-[24px] bg-sky-500 group-hover:bg-sky-600 rounded-t transition-all relative flex justify-center"
                          >
                            <span className="text-[10px] text-sky-900 font-semibold absolute -top-5 hidden sm:block">
                              {Math.round(item.total_units)}
                            </span>
                          </div>

                          {/* Revenue bar */}
                          <div
                            style={{ height: `${revHeight}px` }}
                            className="w-1/2 max-w-[24px] bg-emerald-500 group-hover:bg-emerald-600 rounded-t transition-all relative flex justify-center"
                          >
                            <span className="text-[10px] text-emerald-900 font-semibold absolute -top-5 hidden sm:block">
                              ฿{Math.round(item.billed_amount)}
                            </span>
                          </div>
                        </div>

                        {/* Month label */}
                        <span className="text-xs text-slate-600 font-medium mt-1 truncate">
                          {formatPeriodKeyShort(item.period_key)}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-sky-500" />
                  <span>ปริมาณการใช้น้ำ (ลูกบาศก์เมตร)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                  <span>ยอดค่าน้ำเรียกเก็บ (บาท)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              ไม่มีข้อมูลประวัติย้อนหลัง
            </div>
          )}
        </div>

        {/* Category Breakdown Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-base text-slate-800">สัดส่วนประเภทผู้ใช้น้ำ</h2>
            <p className="text-xs text-slate-500 mb-4">จำแนกตามวัตถุประสงค์การใช้น้ำ</p>

            <div className="space-y-3">
              {categoryBreakdown && categoryBreakdown.map((cat) => {
                const info = CATEGORY_LABELS[cat.category] || { label: cat.category };
                const totalU = users?.total || 1;
                const percent = Math.round((cat.user_count / totalU) * 100);

                return (
                  <div key={cat.category} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{info.label}</span>
                      <span className="text-slate-500 font-medium">
                        {cat.user_count} ราย ({percent}%)
                      </span>
                    </div>
                    {/* Tiny bar */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                      <div
                        className="bg-sky-600 h-1.5 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                      <span>ใช้น้ำ: {formatNumber(cat.total_units || 0)} คิว</span>
                      <span className="font-medium text-slate-700">
                        {formatCurrency(cat.total_revenue || 0)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overdue Debt summary box */}
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold text-rose-900">หนี้ค้างชำระทั้งหมด</span>
              </div>
              <button
                onClick={() => onNavigateTab('reports')}
                className="text-[11px] font-semibold text-rose-700 hover:underline flex items-center gap-0.5"
              >
                ดูรายงาน <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold text-rose-700">
                {formatCurrency(financials?.overdueAmount || 0)}
              </span>
              <span className="text-xs text-rose-600 font-medium">
                {financials?.overdueCount || 0} รายการ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Log Strip */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600" />
            <h2 className="font-bold text-sm text-slate-800">ประวัติการบันทึกรายการล่าสุด (Activity Trail)</h2>
          </div>
          <span className="text-xs text-slate-400">อัปเดตอัตโนมัติ</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
          {recentLogs && recentLogs.length > 0 ? (
            recentLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span className="text-slate-800">{log.description}</span>
                  {log.user_code && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                      {log.user_code}
                    </span>
                  )}
                </div>
                <span className="text-slate-400 text-[11px] whitespace-nowrap ml-4">
                  {new Date(log.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">ยังไม่มีประวัติกิจกรรม</p>
          )}
        </div>
      </div>
    </div>
  );
}
