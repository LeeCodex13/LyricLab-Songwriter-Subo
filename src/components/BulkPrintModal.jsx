import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Droplets,
  Layers,
  CheckCircle2
} from 'lucide-react';
import {
  formatCurrency,
  formatNumber,
  formatPeriodKey,
  formatThaiDate
} from '../utils/formatters';

export default function BulkPrintModal({
  currentPeriod,
  zone,
  onClose
}) {
  const [bills, setBills] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBulkBills() {
      try {
        let url = `/api/bills/bulk/print?period=${currentPeriod}`;
        if (zone && zone !== 'all') {
          url += `&zone=${encodeURIComponent(zone)}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setBills(data.data.bills);
          setSettings(data.data.settings);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadBulkBills();
  }, [currentPeriod, zone]);

  const handlePrint = () => {
    window.print();
  };

  const orgName = settings?.org_name || 'กองการประปา เทศบาลตำบลน้ำใสเจริญ';
  const orgPhone = settings?.org_phone || '053-123456';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col my-auto max-h-[95vh]">
        {/* Action Header (Not printed) */}
        <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-bold text-sm">
                พิมพ์ใบแจ้งหนี้แบบชุด ({bills.length} ใบ) - รอบบิล: {formatPeriodKey(currentPeriod)}
              </h3>
              <p className="text-[11px] text-slate-400">
                {zone === 'all' ? 'ทุกสายการจด' : zone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={bills.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow transition-all disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์ทั้งหมด ({bills.length} บิล)</span>
            </button>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area: Repeating bill cards */}
        <div className="p-6 overflow-y-auto printable-area bg-slate-100 space-y-6">
          {loading ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-xl">
              <Droplets className="w-8 h-8 text-sky-500 animate-bounce mx-auto mb-2" />
              <p className="text-xs">กำลังเตรียมเอกสารใบแจ้งหนี้ทั้งหมด...</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-xl">
              ไม่พบบิลในรอบนี้หรือสายการจดนี้
            </div>
          ) : (
            bills.map((bill, index) => (
              <div
                key={bill.id}
                className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm text-xs page-break-after"
                style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
              >
                {/* Header */}
                <div className="flex justify-between items-start border-b border-sky-700 pb-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{orgName}</h4>
                    <p className="text-[10px] text-slate-500">โทร: {orgPhone}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sky-800 text-xs">ใบแจ้งหนี้ค่าน้ำประปา</span>
                    <p className="font-mono text-[10px] text-slate-600">เลขที่: {bill.bill_no}</p>
                    <p className="text-[10px] text-slate-500">รอบ: {formatPeriodKey(bill.period_key)}</p>
                  </div>
                </div>

                {/* Consumer & Readings info */}
                <div className="grid grid-cols-2 gap-3 my-2 text-[11px]">
                  <div>
                    <p className="font-bold text-slate-900">{bill.user_name} ({bill.user_code})</p>
                    <p className="text-slate-600">บ้านเลขที่ {bill.house_no} {bill.village_no} • {bill.zone}</p>
                    <p className="font-mono text-slate-500">มิเตอร์: {bill.meter_number} (ขนาด {bill.meter_size})</p>
                  </div>
                  <div className="text-right">
                    <p>เลขก่อน: <span className="font-mono font-bold">{formatNumber(bill.previous_reading)}</span></p>
                    <p>เลขนี้: <span className="font-mono font-bold">{formatNumber(bill.current_reading)}</span></p>
                    <p className="font-bold text-sky-800">
                      ใช้ไป: <span className="font-mono">{formatNumber(bill.units_used)}</span> คิว
                    </p>
                  </div>
                </div>

                {/* Amount and QR Box */}
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-2">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-500">
                      ค่าน้ำ {formatNumber(bill.water_charge, 2)} + ค่าบำรุง {formatNumber(bill.service_fee, 2)} บ.
                    </p>
                    <div className="text-sm font-bold text-sky-700">
                      ยอดชำระสุทธิ: {formatCurrency(bill.total_amount)}
                    </div>
                    <p className="text-[10px] text-rose-700 font-bold">
                      กำหนดชำระภายใน: {formatThaiDate(bill.due_date)}
                    </p>
                  </div>

                  {bill.qrCodeDataURL && (
                    <div className="text-center">
                      <img src={bill.qrCodeDataURL} alt="PromptPay QR" className="w-20 h-20 mx-auto" />
                      <span className="text-[8px] font-bold text-sky-900 block">สแกนจ่ายผ่านธนาคาร</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
