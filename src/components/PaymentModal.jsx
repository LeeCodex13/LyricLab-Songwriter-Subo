import React, { useState } from 'react';
import {
  CreditCard,
  X,
  CheckCircle2,
  QrCode,
  Banknote,
  Coins,
  Receipt,
  User,
  Home
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCurrency, formatNumber, formatPeriodKey } from '../utils/formatters';

export default function PaymentModal({
  bill,
  onClose,
  onSuccess
}) {
  const [paymentMethod, setPaymentMethod] = useState('promptpay');
  const [cashReceived, setCashReceived] = useState(String(bill.total_amount));
  const [cashierName, setCashierName] = useState('นางสาวพิมพ์ใจ เจ้าหน้าที่การเงิน');
  const [submitting, setSubmitting] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [loadingQR, setLoadingQR] = useState(true);

  // Fetch real PromptPay QR data URL
  React.useEffect(() => {
    async function loadQR() {
      try {
        const res = await fetch(`/api/promptpay-qr?amount=${bill.total_amount}`);
        const data = await res.json();
        if (data.success && data.dataURL) {
          setQrDataUrl(data.dataURL);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingQR(false);
      }
    }
    loadQR();
  }, [bill.total_amount]);

  const totalAmount = bill.total_amount || 0;
  const cashNum = parseFloat(cashReceived) || 0;
  const change = Math.max(0, cashNum - totalAmount);

  const handleConfirmPayment = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/bills/${bill.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: paymentMethod,
          cashier_name: cashierName,
          paid_amount: totalAmount
        })
      });

      const json = await res.json();
      if (json.success) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        onSuccess(json.data);
      } else {
        alert(json.error || 'บันทึกการชำระเงินไม่สำเร็จ');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการรับชำระ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            <h3 className="font-bold text-base">บันทึกรับชำระเงินค่าน้ำประปา</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Bill Summary Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="font-mono text-slate-500 font-bold">{bill.bill_no}</span>
              <span className="text-emerald-700 bg-emerald-100 font-semibold px-2 py-0.5 rounded">
                รอบบิล: {formatPeriodKey(bill.period_key)}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <User className="w-4 h-4 text-sky-600" />
                  <span>{bill.user_name}</span>
                  <span className="text-[11px] font-mono text-slate-500 font-normal">({bill.user_code})</span>
                </div>
                <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                  <Home className="w-3.5 h-3.5" />
                  <span>บ้านเลขที่ {bill.house_no} {bill.village_no}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">ปริมาณใช้น้ำ</span>
                <span className="font-bold text-slate-800 text-sm">{bill.units_used} คิว</span>
              </div>
            </div>

            {/* Total to pay banner */}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="font-bold text-slate-700 text-sm">ยอดเงินที่ต้องชำระ:</span>
              <span className="font-bold text-2xl text-emerald-600">
                {formatCurrency(bill.total_amount)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">ช่องทางการชำระเงิน:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('promptpay')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'promptpay'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-5 h-5 text-emerald-600" />
                <span>สแกน PromptPay QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span>เงินสด (Cash)</span>
              </button>
            </div>
          </div>

          {/* PromptPay QR Display */}
          {paymentMethod === 'promptpay' && (
            <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-4 text-center space-y-2">
              <span className="text-[11px] font-semibold text-sky-800 block">
                สแกนจ่ายได้ด้วยแอปธนาคารทุกแห่ง (PromptPay EMVCo)
              </span>
              <div className="flex justify-center">
                {loadingQR ? (
                  <div className="w-40 h-40 bg-white rounded-lg flex items-center justify-center text-slate-400">
                    กำลังสร้าง QR...
                  </div>
                ) : qrDataUrl ? (
                  <div className="bg-white p-2.5 rounded-xl shadow-md border border-slate-200 inline-block">
                    <img src={qrDataUrl} alt="PromptPay QR" className="w-44 h-44 mx-auto" />
                    <div className="text-[10px] text-slate-500 font-medium mt-1">
                      ยอดชำระ: {formatCurrency(totalAmount)}
                    </div>
                  </div>
                ) : (
                  <div className="w-40 h-40 bg-slate-100 rounded flex items-center justify-center text-xs">
                    ไม่พบ QR
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cash Change Calculator */}
          {paymentMethod === 'cash' && (
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  จำนวนเงินสดที่ได้รับ (บาท):
                </label>
                <input
                  type="number"
                  step="1"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full text-right font-mono font-bold text-lg px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t border-amber-200 text-sm">
                <span className="font-semibold text-slate-700">เงินทอน:</span>
                <span className="font-bold text-lg text-emerald-700">
                  {formatCurrency(change)}
                </span>
              </div>
            </div>
          )}

          {/* Cashier Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">เจ้าหน้าที่ผู้รับเงิน:</label>
            <input
              type="text"
              value={cashierName}
              onChange={(e) => setCashierName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md shadow-emerald-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'กำลังบันทึก...' : 'ยืนยันการรับชำระเงิน'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
