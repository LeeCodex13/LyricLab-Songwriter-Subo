import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Gauge,
  Home,
  Phone,
  Calendar,
  CreditCard,
  QrCode,
  Droplets,
  Printer,
  History,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  formatCurrency,
  formatNumber,
  formatPeriodKey,
  formatThaiDate,
  CATEGORY_LABELS,
  STATUS_LABELS,
  PAYMENT_STATUS_LABELS
} from '../utils/formatters';

export default function UserDetailModal({
  userId,
  onClose,
  onEdit
}) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meterQrUrl, setMeterQrUrl] = useState('');
  const [activeTab, setActiveTab] = useState('history'); // history, bills, qr_sticker

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/users/${userId}`);
        const json = await res.json();
        if (json.success) {
          setUserData(json.data);

          // Generate Meter QR code sticker
          const qrText = `WATER_METER:${json.data.user_code}:${json.data.meter_number}`;
          const url = await QRCode.toDataURL(qrText, {
            margin: 2,
            scale: 5,
            color: { dark: '#0284c7', light: '#ffffff' }
          });
          setMeterQrUrl(url);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <Droplets className="w-8 h-8 text-sky-500 animate-bounce mx-auto mb-2" />
          <p className="text-slate-500 text-sm">กำลังโหลดข้อมูลผู้ใช้น้ำ...</p>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  const cat = CATEGORY_LABELS[userData.category] || { label: userData.category };
  const stat = STATUS_LABELS[userData.status] || { label: userData.status };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-700 to-cyan-700 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{userData.name}</h3>
                <span className="bg-white/20 font-mono text-xs px-2 py-0.5 rounded">
                  {userData.user_code}
                </span>
              </div>
              <p className="text-xs text-sky-100 mt-0.5">
                บ้านเลขที่ {userData.house_no} {userData.village_no} • {userData.zone}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">หมายเลขมิเตอร์</span>
              <span className="font-mono font-bold text-slate-800 text-sm flex items-center gap-1 mt-0.5">
                <Gauge className="w-3.5 h-3.5 text-sky-600" />
                {userData.meter_number}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">ขนาดท่อมิเตอร์</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{userData.meter_size}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">ประเภทผู้ใช้น้ำ</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{cat.label}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">สถานะ</span>
              <span className="font-bold text-emerald-700 mt-0.5 block">{stat.label}</span>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              ประวัติการจดมิเตอร์ ({userData.readings?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('bills')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'bills'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              ประวัติบิลและการชำระเงิน ({userData.bills?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('qr_sticker')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'qr_sticker'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              ป้าย QR Code ประจำมิเตอร์
            </button>
          </div>

          {/* Tab 1: Meter Readings History */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">รอบเดือน</th>
                      <th className="py-2.5 px-3">วันที่จด</th>
                      <th className="py-2.5 px-3 text-right">เลขครั้งก่อน</th>
                      <th className="py-2.5 px-3 text-right">เลขครั้งนี้</th>
                      <th className="py-2.5 px-3 text-right">ใช้น้ำ (คิว)</th>
                      <th className="py-2.5 px-3">ผู้จด / หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userData.readings && userData.readings.length > 0 ? (
                      userData.readings.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {formatPeriodKey(r.period_key)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{formatThaiDate(r.read_date)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{formatNumber(r.previous_reading)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{formatNumber(r.current_reading)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-700">
                            {formatNumber(r.units_used)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            <div>{r.reader_name}</div>
                            {r.notes && <div className="text-[10px] text-amber-700">{r.notes}</div>}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-400">
                          ยังไม่มีประวัติการจดมิเตอร์
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Bills & Payments History */}
          {activeTab === 'bills' && (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">เลขที่บิล</th>
                      <th className="py-2.5 px-3">รอบเดือน</th>
                      <th className="py-2.5 px-3 text-right">จำนวนหน่วย</th>
                      <th className="py-2.5 px-3 text-right">ยอดรวม (บาท)</th>
                      <th className="py-2.5 px-3 text-center">สถานะ</th>
                      <th className="py-2.5 px-3">เลขที่ใบเสร็จ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userData.bills && userData.bills.length > 0 ? (
                      userData.bills.map((b) => {
                        const billStat = PAYMENT_STATUS_LABELS[b.payment_status] || { label: b.payment_status, badge: '' };
                        return (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-sky-700">{b.bill_no}</td>
                            <td className="py-2.5 px-3 text-slate-700">{formatPeriodKey(b.period_key)}</td>
                            <td className="py-2.5 px-3 text-right font-mono">{b.units_used} คิว</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(b.total_amount)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${billStat.badge}`}>
                                {billStat.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">
                              {b.receipt_no || '-'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-400">
                          ยังไม่มีประวัติบิล
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Meter QR Code Sticker */}
          {activeTab === 'qr_sticker' && (
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-4">
              <div className="max-w-sm mx-auto bg-white p-5 rounded-2xl border-2 border-sky-600 shadow-md">
                <div className="border-b border-sky-100 pb-2 mb-3">
                  <span className="text-[10px] uppercase font-bold text-sky-800 tracking-wider">
                    มาตรวัดน้ำประปาชุมชน
                  </span>
                  <h4 className="font-bold text-slate-800 text-base">{userData.name}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">รหัส: {userData.user_code}</p>
                </div>

                {meterQrUrl && (
                  <div className="my-2">
                    <img src={meterQrUrl} alt="Meter QR" className="w-40 h-40 mx-auto" />
                  </div>
                )}

                <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-0.5">
                  <p className="font-mono font-bold text-slate-800">มิเตอร์เลขที่: {userData.meter_number}</p>
                  <p>บ้านเลขที่ {userData.house_no} {userData.village_no}</p>
                  <p className="text-[9px] text-slate-400">สแกนเพื่อตรวจสอบข้อมูลหรือชำระค่าน้ำ</p>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-sky-600 text-white font-bold rounded-lg text-xs shadow inline-flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์สติกเกอร์ติดมิเตอร์</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
