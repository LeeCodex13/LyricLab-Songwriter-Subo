// Thai date and currency formatters

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0.00 บาท';
  return Number(amount).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' บาท';
}

export function formatNumber(val, decimals = 0) {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return Number(val).toLocaleString('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatPeriodKey(periodKey) {
  if (!periodKey) return '';
  const [yearStr, monthStr] = periodKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const thaiYear = year + 543;
  return `${THAI_MONTHS[month - 1]} ${thaiYear}`;
}

export function formatPeriodKeyShort(periodKey) {
  if (!periodKey) return '';
  const [yearStr, monthStr] = periodKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const thaiYear = (year + 543).toString().slice(-2);
  return `${THAI_MONTHS_SHORT[month - 1]} ${thaiYear}`;
}

export function formatThaiDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = THAI_MONTHS_SHORT[d.getMonth()];
    const thaiYear = d.getFullYear() + 543;
    return `${day} ${month} ${thaiYear}`;
  } catch (e) {
    return dateStr;
  }
}

export function formatThaiDateTime(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = THAI_MONTHS_SHORT[d.getMonth()];
    const thaiYear = d.getFullYear() + 543;
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${thaiYear} ${hours}:${mins} น.`;
  } catch (e) {
    return dateStr;
  }
}

export const CATEGORY_LABELS = {
  residential: { label: 'บ้านพักอาศัย', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  commercial: { label: 'ธุรกิจ / ร้านค้า', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  government: { label: 'สถานที่ราชการ/วัด/โรงเรียน', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  agriculture: { label: 'เกษตรกรรม / ฟาร์ม', badge: 'bg-purple-50 text-purple-700 border-purple-200' }
};

export const STATUS_LABELS = {
  active: { label: 'ปกติ', badge: 'bg-green-100 text-green-800' },
  suspended: { label: 'ระงับชั่วคราว', badge: 'bg-amber-100 text-amber-800' },
  terminated: { label: 'ยกเลิกการใช้น้ำ', badge: 'bg-red-100 text-red-800' }
};

export const PAYMENT_STATUS_LABELS = {
  paid: { label: 'ชำระแล้ว', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  unpaid: { label: 'รอชำระ', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
  overdue: { label: 'เกินกำหนด', badge: 'bg-rose-100 text-rose-800 border-rose-300' }
};

export const ANOMALY_LABELS = {
  normal: { label: 'ปกติ', badge: 'bg-slate-100 text-slate-700' },
  high_usage: { label: 'ใช้น้ำสูงผิดปกติ (อาจมีท่อรั่ว)', badge: 'bg-rose-100 text-rose-800' },
  zero_usage: { label: 'มิเตอร์ไม่หมุน (0 หน่วย)', badge: 'bg-amber-100 text-amber-800' },
  broken_meter: { label: 'มิเตอร์ชำรุด', badge: 'bg-red-100 text-red-800' }
};
