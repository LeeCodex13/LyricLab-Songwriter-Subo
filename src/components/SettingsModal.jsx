import React, { useState } from 'react';
import {
  Settings,
  X,
  Save,
  RotateCcw,
  Download,
  Building,
  CreditCard,
  Sliders,
  Database,
  CheckCircle2
} from 'lucide-react';

export default function SettingsModal({
  settings,
  onClose,
  onSaveSettings,
  onResetDemo
}) {
  const [activeTab, setActiveTab] = useState('org'); // org, promptpay, tariff, data
  const [formData, setFormData] = useState({
    org_name: settings?.org_name || '',
    org_subtitle: settings?.org_subtitle || '',
    org_address: settings?.org_address || '',
    org_phone: settings?.org_phone || '',
    org_tax_id: settings?.org_tax_id || '',
    promptpay_id: settings?.promptpay_id || '',
    promptpay_name: settings?.promptpay_name || '',
    service_fee: String(settings?.service_fee || 20),
    vat_enabled: settings?.vat_enabled ? 'true' : 'false',
    vat_rate: String(settings?.vat_rate || 7),
    due_days: String(settings?.due_days || 15),
    tariff_tiers: settings?.tariff_tiers || {}
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base">ตั้งค่าระบบประปา & อัตราค่าน้ำ</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('org')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'org' ? 'border-sky-600 text-sky-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>ข้อมูลหน่วยงาน</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('promptpay')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'promptpay' ? 'border-sky-600 text-sky-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>บัญชีพร้อมเพย์ (PromptPay)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tariff')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tariff' ? 'border-sky-600 text-sky-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>อัตราค่าน้ำ & ค่าบริการ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'data' ? 'border-sky-600 text-sky-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>จัดการข้อมูล & สำรอง</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>บันทึกการตั้งค่าระบบเรียบร้อยแล้ว</span>
            </div>
          )}

          {/* Org Tab */}
          {activeTab === 'org' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อหน่วยงาน / ระบบประปา</label>
                <input
                  type="text"
                  required
                  value={formData.org_name}
                  onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  placeholder="เช่น กองการประปา เทศบาลตำบลน้ำใสเจริญ"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">คำบรรยาย / ชื่อระบบย่อย</label>
                <input
                  type="text"
                  value={formData.org_subtitle}
                  onChange={(e) => setFormData({ ...formData, org_subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  placeholder="ระบบบริหารจัดการน้ำประปาชุมชนและท้องถิ่น"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ที่อยู่หน่วยงาน</label>
                <textarea
                  rows="2"
                  value={formData.org_address}
                  onChange={(e) => setFormData({ ...formData, org_address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  placeholder="99 หมู่ 2 ถนนประปาสามัคคี ต.น้ำใส อ.เมือง จ.เชียงใหม่"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    value={formData.org_phone}
                    onChange={(e) => setFormData({ ...formData, org_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                    placeholder="053-123456"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เลขประจำตัวผู้เสียภาษี / อปท.</label>
                  <input
                    type="text"
                    value={formData.org_tax_id}
                    onChange={(e) => setFormData({ ...formData, org_tax_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500"
                    placeholder="0994000123456"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PromptPay Tab */}
          {activeTab === 'promptpay' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl text-sky-800">
                <p className="font-bold">PromptPay QR Code สำหรับรับชำระค่าน้ำ</p>
                <p className="text-[11px] text-sky-600 mt-0.5">
                  ระบบจะนำข้อมูลนี้ไปสร้าง QR Code บนใบแจ้งหนี้ให้ผู้ใช้น้ำสแกนจ่ายผ่านแอปพลิเคชันทุกธนาคาร
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  หมายเลขพร้อมเพย์ (เบอร์โทรศัพท์ 10 หลัก หรือ เลขประจำตัว 13 หลัก)
                </label>
                <input
                  type="text"
                  required
                  value={formData.promptpay_id}
                  onChange={(e) => setFormData({ ...formData, promptpay_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500"
                  placeholder="เช่น 0899876543 หรือ 0994000123456"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อบัญชีผู้รับเงิน</label>
                <input
                  type="text"
                  value={formData.promptpay_name}
                  onChange={(e) => setFormData({ ...formData, promptpay_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  placeholder="กองการประปา เทศบาลตำบลน้ำใสเจริญ"
                />
              </div>
            </div>
          )}

          {/* Tariff Tab */}
          {activeTab === 'tariff' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ค่าบริการบำรุงมิเตอร์รายเดือน (บาท)
                  </label>
                  <input
                    type="number"
                    value={formData.service_fee}
                    onChange={(e) => setFormData({ ...formData, service_fee: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ระยะเวลากำหนดชำระ (วัน)
                  </label>
                  <input
                    type="number"
                    value={formData.due_days}
                    onChange={(e) => setFormData({ ...formData, due_days: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 block">อัตราค่าน้ำขั้นบันได (บ้านพักอาศัย):</span>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span>0 - 10 ลบ.ม. แรก</span>
                    <span className="font-bold">8.00 บาท / ลบ.ม.</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span>11 - 20 ลบ.ม.</span>
                    <span className="font-bold">10.00 บาท / ลบ.ม.</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span>21 - 30 ลบ.ม.</span>
                    <span className="font-bold">12.00 บาท / ลบ.ม.</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>31 ลบ.ม. ขึ้นไป</span>
                    <span className="font-bold">15.00 บาท / ลบ.ม.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 block">สำรองข้อมูลระบบ (Backup Database)</span>
                <p className="text-slate-500 text-[11px]">
                  ดาวน์โหลดไฟล์สำรองข้อมูลทั้งหมดในระบบ (ผู้ใช้น้ำ, ประวัติมิเตอร์, ประวัติบิล) ในรูปแบบ JSON
                </p>
                <a
                  href="/api/backup"
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold text-slate-800 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์สำรองข้อมูล</span>
                </a>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <span className="font-bold text-amber-900 block">สร้างข้อมูลตัวอย่างเสมือนจริง (Reset & Demo Data)</span>
                <p className="text-amber-800 text-[11px]">
                  ล้างข้อมูลและสร้างข้อมูลตัวอย่างผู้ใช้น้ำ 20 รายการ พร้อมประวัติมิเตอร์และบิลย้อนหลัง 6 เดือน
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('คุณต้องการรีเซ็ตและสร้างชุดข้อมูลตัวอย่างใหม่ใช่หรือไม่?')) {
                      onResetDemo();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-sm transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>รีเซ็ตและโหลดข้อมูลตัวอย่าง</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold shadow-md shadow-sky-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
