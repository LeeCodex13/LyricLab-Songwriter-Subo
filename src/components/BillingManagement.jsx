import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  CreditCard,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Layers,
  Download,
  Coins
} from 'lucide-react';
import {
  formatCurrency,
  formatNumber,
  formatPeriodKey,
  formatThaiDate,
  PAYMENT_STATUS_LABELS,
  CATEGORY_LABELS
} from '../utils/formatters';
import PaymentModal from './PaymentModal';
import BillPrintModal from './BillPrintModal';
import ReceiptPrintModal from './ReceiptPrintModal';
import BulkPrintModal from './BulkPrintModal';

export default function BillingManagement({
  currentPeriod,
  zones
}) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedZone, setSelectedZone] = useState('all');

  // Modals state
  const [activePaymentBill, setActivePaymentBill] = useState(null);
  const [activePrintBillId, setActivePrintBillId] = useState(null);
  const [activeReceiptBillId, setActiveReceiptBillId] = useState(null);
  const [bulkPrintOpen, setBulkPrintOpen] = useState(false);

  const fetchBills = async () => {
    setLoading(true);
    try {
      let url = `/api/bills?period=${currentPeriod}`;
      if (selectedStatus !== 'all') url += `&status=${selectedStatus}`;
      if (selectedZone !== 'all') url += `&zone=${encodeURIComponent(selectedZone)}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setBills(data.data);
      }
    } catch (e) {
      console.error('Error fetching bills:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [currentPeriod, selectedStatus, selectedZone, searchQuery]);

  const handleRevertPayment = async (billId, billNo) => {
    if (!confirm(`คุณต้องการยกเลิกสถานะการชำระเงินของบิล "${billNo}" กลับเป็น "รอชำระ" ใช่หรือไม่?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/bills/${billId}/unpay`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchBills();
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการยกเลิกสถานะ');
    }
  };

  // Stats calculation
  const totalBilled = bills.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const totalPaid = bills.filter((b) => b.payment_status === 'paid').reduce((sum, b) => sum + (b.paid_amount || b.total_amount || 0), 0);
  const totalUnpaid = bills.filter((b) => b.payment_status !== 'paid').reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const paidCount = bills.filter((b) => b.payment_status === 'paid').length;
  const unpaidCount = bills.filter((b) => b.payment_status !== 'paid').length;

  return (
    <div className="space-y-5">
      {/* Header and Bulk Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <Receipt className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                จัดการใบแจ้งหนี้ & บันทึกรับชำระเงิน: {formatPeriodKey(currentPeriod)}
              </h2>
              <p className="text-xs text-slate-500">
                พิมพ์ใบแจ้งหนี้ สแกน PromptPay QR รับชำระเงินสด และออกใบเสร็จรับเงิน
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk Print button */}
          <button
            onClick={() => setBulkPrintOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-all shadow-sm"
          >
            <Layers className="w-4 h-4 text-sky-600" />
            <span>พิมพ์ใบแจ้งหนี้แบบชุด ({bills.length} ใบ)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">ยอดเรียกเก็บทั้งหมด</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{formatCurrency(totalBilled)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{bills.length} ฉบับในตัวกรองนี้</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ชำระแล้ว (Paid)
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {paidCount} ฉบับ ({bills.length > 0 ? Math.round((paidCount / bills.length) * 100) : 0}%)
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 uppercase flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            คงค้างชำระ (Pending)
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{formatCurrency(totalUnpaid)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{unpaidCount} ฉบับ</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตามเลขที่บิล, ชื่อผู้ใช้น้ำ, บ้านเลขที่..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">ทุกสถานะการชำระ</option>
            <option value="unpaid">รอชำระ (Unpaid)</option>
            <option value="paid">ชำระแล้ว (Paid)</option>
            <option value="overdue">เกินกำหนด (Overdue)</option>
          </select>

          {/* Zone filter */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">ทุกสาย / โซน</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">เลขที่บิล</th>
                <th className="py-3 px-3">ผู้ใช้น้ำ / ที่อยู่</th>
                <th className="py-3 px-3 text-right">ใช้น้ำ (คิว)</th>
                <th className="py-3 px-3 text-right">ยอดรวม (บาท)</th>
                <th className="py-3 px-3 text-center">สถานะ</th>
                <th className="py-3 px-3">กำหนด / วันที่ชำระ</th>
                <th className="py-3 px-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    กำลังโหลดข้อมูลบิล...
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium">ไม่พบบิลค่าน้ำในเงื่อนไขนี้</p>
                  </td>
                </tr>
              ) : (
                bills.map((bill) => {
                  const stat = PAYMENT_STATUS_LABELS[bill.payment_status] || { label: bill.payment_status, badge: '' };
                  const isPaid = bill.payment_status === 'paid';

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Bill No */}
                      <td className="py-3 px-3 font-mono font-bold text-sky-700">
                        {bill.bill_no}
                      </td>

                      {/* User Info */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">
                          {bill.user_name}
                          <span className="font-mono text-[10px] text-slate-500 ml-1.5 font-normal">
                            ({bill.user_code})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          บ้านเลขที่ {bill.house_no} {bill.village_no} • {bill.zone}
                        </div>
                      </td>

                      {/* Units Used */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                        {bill.units_used}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(bill.total_amount)}
                      </td>

                      {/* Payment Status Badge */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${stat.badge}`}>
                          {stat.label}
                        </span>
                      </td>

                      {/* Due / Paid Date */}
                      <td className="py-3 px-3">
                        {isPaid ? (
                          <div>
                            <span className="text-[11px] text-emerald-700 font-semibold block">
                              ชำระเมื่อ: {formatThaiDate(bill.paid_date)}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              โดย: {bill.payment_method === 'promptpay' ? 'พร้อมเพย์' : 'เงินสด'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600">
                            ครบกำหนด: {formatThaiDate(bill.due_date)}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Pay Button (if unpaid) */}
                          {!isPaid ? (
                            <button
                              onClick={() => setActivePaymentBill(bill)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                              title="บันทึกรับชำระเงิน"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>รับเงิน</span>
                            </button>
                          ) : (
                            /* Receipt button if paid */
                            <button
                              onClick={() => setActiveReceiptBillId(bill.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                              title="พิมพ์ใบเสร็จรับเงิน"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>ใบเสร็จ</span>
                            </button>
                          )}

                          {/* Print Invoice Button */}
                          <button
                            onClick={() => setActivePrintBillId(bill.id)}
                            className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors border border-slate-200"
                            title="ดูใบแจ้งหนี้ / พิมพ์บิล"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Revert payment if paid */}
                          {isPaid && (
                            <button
                              onClick={() => handleRevertPayment(bill.id, bill.bill_no)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="ยกเลิกการชำระเงิน"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {activePaymentBill && (
        <PaymentModal
          bill={activePaymentBill}
          onClose={() => setActivePaymentBill(null)}
          onSuccess={(paidData) => {
            setActivePaymentBill(null);
            fetchBills();
          }}
        />
      )}

      {/* Single Invoice Print Modal */}
      {activePrintBillId && (
        <BillPrintModal
          billId={activePrintBillId}
          onClose={() => setActivePrintBillId(null)}
        />
      )}

      {/* Single Receipt Print Modal */}
      {activeReceiptBillId && (
        <ReceiptPrintModal
          billId={activeReceiptBillId}
          onClose={() => setActiveReceiptBillId(null)}
        />
      )}

      {/* Bulk Print Modal */}
      {bulkPrintOpen && (
        <BulkPrintModal
          currentPeriod={currentPeriod}
          zone={selectedZone}
          onClose={() => setBulkPrintOpen(false)}
        />
      )}
    </div>
  );
}
