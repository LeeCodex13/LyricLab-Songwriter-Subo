import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Droplets,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import {
  formatCurrency,
  formatNumber,
  formatPeriodKey,
  formatThaiDateTime,
  formatThaiDate
} from '../utils/formatters';

export default function ReceiptPrintModal({
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
          <p className="text-slate-500 text-sm">กำลังโหลดข้อมูลใบเสร็จรับเงิน...</p>
        </div>
      </div>
    );
  }

  if (!bill) return null;

  const { settings } = bill;
  const orgName = settings?.org_name || 'กองการประปา เทศบาลตำบลน้ำใสเจริญ';
  const orgAddress = settings?.org_address || '99 หมู่ 2 ต.น้ำใส อ.เมือง จ.เชียงใหม่';
  const orgTaxId = settings?.org_tax_id || '0994000123456';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 flex flex-col my-auto max-h-[95vh]">
        {/* Action Bar */}
        <div className="bg-emerald-800 text-white px-5 py-3 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-300" />
            <span className="font-bold text-sm">ใบเสร็จรับเงินค่าน้ำประปา (Receipt Preview)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบเสร็จ</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt */}
        <div className="p-6 sm:p-8 overflow-y-auto printable-area bg-white text-slate-800 font-sans text-xs relative">
          {/* PAID Watermark / Stamp */}
          <div className="absolute right-12 top-24 border-4 border-emerald-500/40 text-emerald-600/40 font-black text-2xl uppercase tracking-widest px-4 py-1 rounded-lg rotate-[-12deg] pointer-events-none select-none">
            ชำระเงินแล้ว (PAID)
          </div>

          {/* Org Header */}
          <div className="text-center border-b pb-4 border-slate-300">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white mx-auto mb-1">
              <Droplets className="w-6 h-6" />
            </div>
            <h1 className="text-base font-bold text-slate-900">{orgName}</h1>
            <p className="text-[11px] text-slate-600">{orgAddress}</p>
            <p className="text-[11px] text-slate-500">เลขประจำตัวผู้เสียภาษี: {orgTaxId}</p>

            <div className="mt-3 inline-block bg-emerald-50 text-emerald-900 border border-emerald-200 px-4 py-1 rounded-full font-bold text-sm">
              ใบเสร็จรับเงิน (RECEIPT)
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 my-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-slate-500">เลขที่ใบเสร็จ:</p>
              <p className="font-mono font-bold text-slate-900">{bill.receipt_no || 'REC-' + bill.id}</p>
              <p className="text-slate-500 mt-2">อ้างอิงใบแจ้งหนี้:</p>
              <p className="font-mono text-slate-700">{bill.bill_no}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">วันที่ชำระเงิน:</p>
              <p className="font-semibold text-slate-900">{formatThaiDateTime(bill.paid_date)}</p>
              <p className="text-slate-500 mt-2">ช่องทางชำระ:</p>
              <p className="font-semibold text-emerald-700 capitalize">
                {bill.payment_method === 'promptpay' ? 'พร้อมเพย์ (PromptPay)' : 'เงินสด (Cash)'}
              </p>
            </div>
          </div>

          {/* User Details */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4">
            <div className="flex justify-between">
              <div>
                <span className="text-slate-500 block">ได้รับเงินจาก:</span>
                <span className="font-bold text-slate-900 text-sm">{bill.user_name}</span>
                <span className="text-[10px] text-slate-500 font-mono ml-2">({bill.user_code})</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">มิเตอร์เลขที่:</span>
                <span className="font-mono font-bold text-slate-800">{bill.meter_number}</span>
              </div>
            </div>
            <p className="text-slate-600 mt-1">
              ที่อยู่: บ้านเลขที่ {bill.house_no} {bill.village_no} {bill.subdistrict} {bill.district} {bill.province}
            </p>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs border-collapse mb-4">
            <thead>
              <tr className="bg-slate-100 border-y border-slate-300 font-semibold text-slate-700">
                <th className="py-2 px-3 text-left">รายการชำระ</th>
                <th className="py-2 px-3 text-right">จำนวนหน่วย</th>
                <th className="py-2 px-3 text-right">จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-2 px-3 font-medium">
                  ค่าน้ำประปา ประจำรอบ {formatPeriodKey(bill.period_key)}
                </td>
                <td className="py-2 px-3 text-right font-mono">{bill.units_used} คิว</td>
                <td className="py-2 px-3 text-right font-mono">{formatNumber(bill.water_charge, 2)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium">ค่าบำรุงรักษามิเตอร์</td>
                <td className="py-2 px-3 text-right font-mono">1 เดือน</td>
                <td className="py-2 px-3 text-right font-mono">{formatNumber(bill.service_fee, 2)}</td>
              </tr>
              {bill.vat_amount > 0 && (
                <tr>
                  <td className="py-2 px-3 font-medium">ภาษีมูลค่าเพิ่ม (VAT 7%)</td>
                  <td className="py-2 px-3 text-right font-mono">-</td>
                  <td className="py-2 px-3 text-right font-mono">{formatNumber(bill.vat_amount, 2)}</td>
                </tr>
              )}
              <tr className="bg-emerald-50/70 font-bold text-sm text-emerald-950">
                <td colSpan="2" className="py-2.5 px-3">ยอดเงินชำระทั้งสิ้น (Total Paid)</td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                  {formatCurrency(bill.paid_amount || bill.total_amount)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer & Signature */}
          <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 text-center text-[11px] text-slate-600">
            <div>
              <p>ผู้ชำระเงิน</p>
              <div className="h-8"></div>
              <p>({bill.user_name})</p>
            </div>
            <div>
              <p>ผู้รับเงิน / พนักงานการเงิน</p>
              <div className="h-8"></div>
              <p>({bill.cashier_name || 'นางสาวพิมพ์ใจ เจ้าหน้าที่การเงิน'})</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
