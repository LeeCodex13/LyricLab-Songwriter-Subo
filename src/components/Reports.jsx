import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  AlertTriangle,
  Download,
  Printer,
  FileText,
  DollarSign,
  Droplets,
  Calendar,
  X,
  Send
} from 'lucide-react';
import {
  formatCurrency,
  formatNumber,
  formatPeriodKey,
  formatThaiDate,
  CATEGORY_LABELS
} from '../utils/formatters';

export default function Reports({
  currentPeriod,
  periods
}) {
  const [activeReportTab, setActiveReportTab] = useState('monthly'); // monthly, overdue
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);
  const [monthlyData, setMonthlyData] = useState(null);
  const [overdueData, setOverdueData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Warning Letter Modal State
  const [warningDebtor, setWarningDebtor] = useState(null);

  const fetchMonthly = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?period=${selectedPeriod}`);
      const data = await res.json();
      if (data.success) {
        setMonthlyData(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdue = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/overdue');
      const data = await res.json();
      if (data.success) {
        setOverdueData(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeReportTab === 'monthly') {
      fetchMonthly();
    } else {
      fetchOverdue();
    }
  }, [activeReportTab, selectedPeriod]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                รายงานสถิติ & ติดตามหนี้ค้างชำระ
              </h2>
              <p className="text-xs text-slate-500">
                สรุปยอดจำหน่ายน้ำ รายรับประจำเดือน และออกหนังสือเตือนผู้ค้างชำระ
              </p>
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveReportTab('monthly')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeReportTab === 'monthly'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            รายงานสรุปรายเดือน
          </button>
          <button
            onClick={() => setActiveReportTab('overdue')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeReportTab === 'overdue'
                ? 'bg-white text-rose-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>ลูกหนี้ค้างชำระ</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Monthly Report */}
      {activeReportTab === 'monthly' && (
        <div className="space-y-5">
          {/* Period selector & Print button */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">เลือกรอบประจำเดือน:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg font-medium bg-white focus:ring-2 focus:ring-indigo-500"
              >
                {periods.map((p) => (
                  <option key={p.period_key} value={p.period_key}>
                    {formatPeriodKey(p.period_key)}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors border border-slate-200"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์รายงานหน้านี้</span>
            </button>
          </div>

          {/* Monthly KPI Summary */}
          {monthlyData?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">ปริมาณน้ำจำหน่ายรวม</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-slate-800">
                    {formatNumber(monthlyData.summary.total_units)}
                  </span>
                  <span className="text-xs text-slate-500">คิว</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">ยอดค่าน้ำเรียกเก็บรวม</span>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-slate-800">
                    {formatCurrency(monthlyData.summary.total_amount)}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-semibold text-emerald-600 uppercase">จัดเก็บเงินได้แล้ว</span>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(monthlyData.summary.total_collected)}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {monthlyData.summary.paid_count} รายการ
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-semibold text-amber-600 uppercase">ยอดค้างชำระประจำรอบ</span>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-amber-600">
                    {formatCurrency(monthlyData.summary.total_unpaid)}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {monthlyData.summary.unpaid_count} รายการ
                </span>
              </div>
            </div>
          )}

          {/* Breakdown by Zone Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
            <div className="px-5 py-3 border-b border-slate-200 font-bold text-slate-800 bg-slate-50">
              สถิติแยกตามสายการจด / โซน
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 font-semibold text-slate-600">
                    <th className="py-2.5 px-4">สายการจด / โซน</th>
                    <th className="py-2.5 px-4 text-center">จำนวนผู้ใช้</th>
                    <th className="py-2.5 px-4 text-right">ปริมาณน้ำ (คิว)</th>
                    <th className="py-2.5 px-4 text-right">ยอดเรียกเก็บ (บาท)</th>
                    <th className="py-2.5 px-4 text-right">เก็บได้แล้ว (บาท)</th>
                    <th className="py-2.5 px-4 text-right">ค้างชำระ (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyData?.byZone?.map((z) => (
                    <tr key={z.zone} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-800">{z.zone}</td>
                      <td className="py-2.5 px-4 text-center font-mono">{z.bills_count}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-sky-700">
                        {formatNumber(z.units_used)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(z.total_amount)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(z.paid_amount)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700">
                        {formatCurrency(z.unpaid_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Overdue Debtors Report */}
      {activeReportTab === 'overdue' && (
        <div className="space-y-5">
          {/* Overdue Total Banner */}
          <div className="bg-rose-50 border border-rose-200 p-5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-rose-950 text-base">
                  ลูกหนี้ค้างชำระค่าน้ำประปาทั้งหมด ({overdueData?.totalDebtors || 0} ราย)
                </h3>
                <p className="text-xs text-rose-800 mt-0.5">
                  รายการบิลที่เกินกำหนดชำระ สามารถออกหนังสือแจ้งเตือนชำระหนี้ค่าน้ำประปาได้
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-rose-800 font-semibold block">ยอดหนี้ค้างชำระสะสม</span>
              <span className="text-2xl font-bold text-rose-700">
                {formatCurrency(overdueData?.totalDebtAmount || 0)}
              </span>
            </div>
          </div>

          {/* Debtors List Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">รหัส / ผู้ใช้น้ำ</th>
                    <th className="py-3 px-4">ที่อยู่ / โซน</th>
                    <th className="py-3 px-4 font-mono">หมายเลขมิเตอร์</th>
                    <th className="py-3 px-4 text-center">จำนวนบิลที่ค้าง</th>
                    <th className="py-3 px-4 text-right">ยอดหนี้รวม (บาท)</th>
                    <th className="py-3 px-4 text-center">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overdueData?.debtors && overdueData.debtors.length > 0 ? (
                    overdueData.debtors.map((debtor) => (
                      <tr key={debtor.user_id} className="hover:bg-rose-50/20">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sky-700 font-bold bg-sky-50 px-1 py-0.5 rounded text-[10px]">
                            {debtor.user_code}
                          </span>
                          <div className="font-bold text-slate-900 mt-0.5">{debtor.name}</div>
                          {debtor.phone && (
                            <div className="text-[10px] text-slate-500">{debtor.phone}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div>บ้านเลขที่ {debtor.house_no} {debtor.village_no}</div>
                          <div className="text-[10px] text-slate-400">{debtor.zone}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                          {debtor.meter_number}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            {debtor.overdue_bills_count} บิล
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-700 text-sm">
                          {formatCurrency(debtor.total_overdue_amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setWarningDebtor(debtor)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>ออกหนังสือเตือน</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        ไม่มีลูกหนี้ค้างชำระในระบบ (ยอดชำระครบถ้วน)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Warning Notice Modal */}
      {warningDebtor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 flex flex-col my-auto max-h-[95vh]">
            <div className="bg-rose-800 text-white px-5 py-3 flex items-center justify-between no-print">
              <span className="font-bold text-sm">หนังสือเตือนให้ชำระหนี้ค่าน้ำประปา</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-white text-rose-900 font-bold rounded-lg text-xs shadow flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์หนังสือ</span>
                </button>
                <button onClick={() => setWarningDebtor(null)} className="p-1 text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 text-xs font-sans text-slate-800 printable-area leading-relaxed space-y-4">
              {/* Official Letter Header */}
              <div className="text-center border-b pb-4 border-slate-200">
                <h3 className="font-bold text-base text-slate-900">กองการประปา เทศบาลตำบลน้ำใสเจริญ</h3>
                <p className="text-[11px] text-slate-500">99 หมู่ 2 ถนนประปาสามัคคี ต.น้ำใส อ.เมือง จ.เชียงใหม่</p>
                <h4 className="font-bold text-sm text-rose-800 mt-2">
                  หนังสือเตือนให้ชำระเงินค่าน้ำประปาค้างชำระ
                </h4>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>ที่ นส ๕๒๐๑/ว.พิเศษ</span>
                <span>วันที่ {formatThaiDate(new Date().toISOString())}</span>
              </div>

              <div>
                <p className="font-bold text-slate-900">
                  เรื่อง: ขอให้ชำระเงินค่าน้ำประปาค้างชำระ
                </p>
                <p className="mt-1">
                  เรียน: <span className="font-bold">{warningDebtor.name}</span> (รหัสผู้ใช้น้ำ: {warningDebtor.user_code})
                </p>
                <p>
                  บ้านเลขที่: {warningDebtor.house_no} {warningDebtor.village_no} (มิเตอร์เลขที่: {warningDebtor.meter_number})
                </p>
              </div>

              <p className="text-justify text-slate-700 indent-6">
                ตามที่ท่านได้ใช้น้ำประปาของกองการประปา เทศบาลตำบลน้ำใสเจริญ
                จากการตรวจสอบข้อมูลพบว่า ท่านมีรายการค้างชำระค่าน้ำประปาจำนวน{' '}
                <span className="font-bold">{warningDebtor.overdue_bills_count} รอบบิล</span> รวมเป็นเงินทั้งสิ้น{' '}
                <span className="font-bold text-rose-700 text-sm">
                  {formatCurrency(warningDebtor.total_overdue_amount)}
                </span>
              </p>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold block text-slate-700">รายการบิลที่ค้างชำระ:</span>
                {warningDebtor.bills?.map((b) => (
                  <div key={b.id} className="flex justify-between text-[11px]">
                    <span>รอบเดือน {formatPeriodKey(b.period_key)} (เลขที่บิล {b.bill_no})</span>
                    <span className="font-mono font-bold text-slate-800">{formatCurrency(b.total_amount)}</span>
                  </div>
                ))}
              </div>

              <p className="text-justify text-slate-700 indent-6">
                เพื่อมิให้เกิดการระงับการจ่ายน้ำประปาตามระเบียบเทศบาล จึงขอความร่วมมือจากท่านโปรดติดต่อชำระเงิน
                ค่าน้ำประปาที่ค้างชำระ ณ ที่ทำการกองการประปา หรือสแกน QR Code พร้อมเพย์ตามใบแจ้งหนี้
                ภายใน 7 วัน นับตั้งแต่วันที่ได้รับหนังสือฉบับนี้
              </p>

              <div className="mt-8 pt-4 text-center ml-auto w-64 space-y-4">
                <p>ขอแสดงความนับถือ</p>
                <div className="h-10"></div>
                <p>(นายสมชาย มั่นคงดี)</p>
                <p className="text-[11px] text-slate-500">หัวหน้าฝ่ายบริหารงานประปา</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
