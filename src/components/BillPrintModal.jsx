import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Droplets,
  Calendar,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  formatCurrency,
  formatNumber,
  formatPeriodKey,
  formatThaiDate,
  CATEGORY_LABELS
} from '../utils/formatters';

export default function BillPrintModal({
  billId,
  onClose
}) {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBill() {
      try {
        const res = await fetch(`/api/bills/${billId}`);
        const data = await res.json();
        if (data.success) {
          setBill(data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadBill();
  }, [billId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center">
          <Droplets className="w-8 h-8 text-sky-500 animate-bounce mx-auto mb-2" />
          <p className="text-slate-500 text-sm">กำลังโหลดข้อมูลใบแจ้งหนี้...</p>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white p-6 rounded-xl shadow-xl text-center">
          <p className="text-red-500 font-bold mb-4">ไม่พบข้อมูลใบแจ้งหนี้</p>
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-lg text-xs font-bold">
            ปิด
          </button>
        </div>
      </div>
    );
  }

  const { settings } = bill;
  const orgName = settings?.org_name || 'กองการประปา เทศบาลตำบลน้ำใสเจริญ';
  const orgAddress = settings?.org_address || '99 หมู่ 2 ต.น้ำใส อ.เมือง จ.เชียงใหม่';
  const orgPhone = settings?.org_phone || '053-123456';
  const orgTaxId = settings?.org_tax_id || '0994000123456';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col my-auto max-h-[95vh]">
        {/* Action Bar (Not printed) */}
        <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-sm">ใบแจ้งหนี้ค่าน้ำประปา (Invoice Preview)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์ / บันทึก PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document */}
        <div className="p-6 sm:p-8 overflow-y-auto printable-area bg-white text-slate-800 font-sans text-xs">
          {/* Header */}
          <div className="border-b-2 border-sky-800 pb-4 flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-700 flex items-center justify-center text-white shrink-0">
                <Droplets className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight">{orgName}</h1>
                <p className="text-[11px] text-slate-600 mt-0.5">{orgAddress}</p>
                <p className="text-[11px] text-slate-500">โทร: {orgPhone} | เลขประจำตัวผู้เสียภาษี: {orgTaxId}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-sky-100 text-sky-900 rounded-md font-bold text-sm uppercase">
                ใบแจ้งหนี้ค่าน้ำประปา
              </span>
              <div className="font-mono font-bold text-slate-700 text-xs mt-1">
                เลขที่: {bill.bill_no}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                ประจำรอบ: <span className="font-bold text-slate-800">{formatPeriodKey(bill.period_key)}</span>
              </div>
            </div>
          </div>

          {/* Consumer and Due Date Grid */}
          <div className="grid grid-cols-2 gap-4 my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">ข้อมูลผู้ใช้น้ำ</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{bill.user_name}</div>
              <div className="text-slate-600 mt-0.5">
                รหัสผู้ใช้น้ำ: <span className="font-mono font-semibold">{bill.user_code}</span>
              </div>
              <div className="text-slate-600">
                ที่อยู่: บ้านเลขที่ {bill.house_no} {bill.village_no} {bill.subdistrict} {bill.district} {bill.province}
              </div>
              <div className="text-slate-600">
                สายการจด: {bill.zone}
              </div>
            </div>

            <div className="border-l border-slate-200 pl-4 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">ข้อมูลมิเตอร์ & กำหนดชำระ</div>
              <div className="flex justify-between">
                <span className="text-slate-600">เลขมิเตอร์:</span>
                <span className="font-mono font-bold text-slate-800">{bill.meter_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">ขนาดมาตรวัด:</span>
                <span className="text-slate-800">{bill.meter_size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">วันที่จดมิเตอร์:</span>
                <span className="text-slate-800">{formatThaiDate(bill.read_date)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="font-bold text-rose-700">กำหนดชำระภายใน:</span>
                <span className="font-bold text-rose-700">{formatThaiDate(bill.due_date)}</span>
              </div>
            </div>
          </div>

          {/* Meter Readings Table */}
          <table className="w-full border-collapse my-3 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-y border-slate-300">
                <th className="py-2 px-3 text-left">รายการ</th>
                <th className="py-2 px-3 text-right">เลขครั้งก่อน</th>
                <th className="py-2 px-3 text-right">เลขครั้งนี้</th>
                <th className="py-2 px-3 text-right">จำนวนหน่วยที่ใช้ (ลบ.ม.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-2.5 px-3 font-medium">การใช้น้ำประปาประจำเดือน ({formatPeriodKey(bill.period_key)})</td>
                <td className="py-2.5 px-3 text-right font-mono">{formatNumber(bill.previous_reading)}</td>
                <td className="py-2.5 px-3 text-right font-mono">{formatNumber(bill.current_reading)}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-800 text-sm">
                  {formatNumber(bill.units_used)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Charges Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden my-3">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-4 text-slate-600">ค่าน้ำประปาตามปริมาณการใช้ ({bill.units_used} หน่วย)</td>
                  <td className="py-2 px-4 text-right font-mono font-medium text-slate-800">
                    {formatNumber(bill.water_charge, 2)} บาท
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-slate-600">ค่าบำรุงรักษามิเตอร์ / ค่าบริการรายเดือน</td>
                  <td className="py-2 px-4 text-right font-mono font-medium text-slate-800">
                    {formatNumber(bill.service_fee, 2)} บาท
                  </td>
                </tr>
                {bill.vat_amount > 0 && (
                  <tr>
                    <td className="py-2 px-4 text-slate-600">ภาษีมูลค่าเพิ่ม (VAT 7%)</td>
                    <td className="py-2 px-4 text-right font-mono font-medium text-slate-800">
                      {formatNumber(bill.vat_amount, 2)} บาท
                    </td>
                  </tr>
                )}
                <tr className="bg-sky-50/80 font-bold text-sm text-sky-950">
                  <td className="py-3 px-4">ยอดรวมที่ต้องชำระสุทธิ (Net Total)</td>
                  <td className="py-3 px-4 text-right font-mono text-lg text-sky-700">
                    {formatCurrency(bill.total_amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment & PromptPay QR Section */}
          <div className="mt-4 p-4 border border-slate-300 rounded-xl bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h4 className="font-bold text-slate-800 text-xs">วิธีชำระเงิน: สแกน QR Code พร้อมเพย์</h4>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                ท่านสามารถเปิดแอปพลิเคชันธนาคารบนมือถือและสแกน QR Code นี้เพื่อชำระค่าน้ำได้ทันที
                ยอดเงินระบุตรงตามบิล {formatCurrency(bill.total_amount)}
              </p>
              <p className="text-[10px] text-slate-500">
                ชื่อบัญชี: {settings?.promptpay_name || orgName}
              </p>
              <div className="text-[10px] text-rose-700 font-semibold pt-1">
                * กรุณาชำระเงินภายในวันที่ {formatThaiDate(bill.due_date)}
              </div>
            </div>

            {/* PromptPay QR Code Image */}
            <div className="text-center shrink-0">
              {bill.qrCodeDataURL ? (
                <div className="bg-white p-2 rounded-xl border border-slate-300 shadow-sm inline-block">
                  <img src={bill.qrCodeDataURL} alt="PromptPay QR" className="w-32 h-32 mx-auto" />
                  <span className="block text-[9px] font-bold text-sky-900 mt-1">PromptPay</span>
                </div>
              ) : (
                <div className="w-32 h-32 bg-slate-200 rounded flex items-center justify-center text-[10px]">
                  ไม่มี QR
                </div>
              )}
            </div>
          </div>

          {/* Signature Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 text-center text-[11px] text-slate-500">
            <div>
              <p>ผู้จดมิเตอร์: {bill.reader_name || 'นายสมหมาย พิทักษ์น้ำ'}</p>
              <p className="mt-1">วันที่จด: {formatThaiDate(bill.read_date)}</p>
            </div>
            <div>
              <p>ผู้จัดการระบบประปา / นายกเทศมนตรี</p>
              <div className="h-6"></div>
              <p>(........................................................)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
