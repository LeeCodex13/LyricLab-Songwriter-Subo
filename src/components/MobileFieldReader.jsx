import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  Save,
  Gauge,
  Home,
  User,
  Calendar,
  CheckCircle2,
  Camera,
  ArrowRight
} from 'lucide-react';
import { formatNumber, formatPeriodKey } from '../utils/formatters';

export default function MobileFieldReader({
  currentPeriod,
  zones,
  onNavigateTab
}) {
  const [selectedZone, setSelectedZone] = useState('all');
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch items for the zone
  const fetchItems = async () => {
    setLoading(true);
    try {
      let url = `/api/readings/sheet?period=${currentPeriod}`;
      if (selectedZone !== 'all') {
        url += `&zone=${encodeURIComponent(selectedZone)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
        setCurrentIndex(0);
        if (data.data.length > 0) {
          const first = data.data[0];
          setCurrentInput(first.current_reading !== null ? String(first.current_reading) : '');
          setNotesInput(first.notes || '');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentPeriod, selectedZone]);

  // When index changes, sync inputs
  const currentItem = items[currentIndex];

  const handleSelectIndex = (idx) => {
    if (idx < 0 || idx >= items.length) return;
    setCurrentIndex(idx);
    const target = items[idx];
    setCurrentInput(target.current_reading !== null ? String(target.current_reading) : '');
    setNotesInput(target.notes || '');
    setSavedSuccess(false);
  };

  const handleSaveAndNext = async () => {
    if (!currentItem) return;
    if (currentInput === '') {
      alert('กรุณากรอกเลขมิเตอร์ครั้งนี้');
      return;
    }

    const prev = parseFloat(currentItem.previous_reading) || 0;
    const curr = parseFloat(currentInput) || 0;

    if (curr < prev) {
      alert(`เลขมิเตอร์ครั้งนี้ (${curr}) ต้องไม่น้อยกว่าครั้งก่อน (${prev})`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentItem.user_id,
          period_key: currentPeriod,
          read_date: new Date().toISOString().split('T')[0],
          previous_reading: prev,
          current_reading: curr,
          reader_name: 'นายสมหมาย พิทักษ์น้ำ',
          notes: notesInput
        })
      });

      const json = await res.json();
      if (json.success) {
        setSavedSuccess(true);
        // Update local item
        const updatedList = [...items];
        updatedList[currentIndex] = {
          ...updatedList[currentIndex],
          current_reading: curr,
          units_used: json.data.units_used,
          notes: notesInput,
          is_recorded: true
        };
        setItems(updatedList);

        // Advance to next after short delay
        setTimeout(() => {
          if (currentIndex < items.length - 1) {
            handleSelectIndex(currentIndex + 1);
          } else {
            alert('จดมิเตอร์ครบทุกหลังในสายนี้แล้ว!');
          }
        }, 600);
      } else {
        alert(json.error || 'บันทึกไม่สำเร็จ');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const prev = currentItem ? parseFloat(currentItem.previous_reading) || 0 : 0;
  const curr = currentInput !== '' ? parseFloat(currentInput) : null;
  let units = null;
  let isNegative = false;
  let isHigh = false;

  if (curr !== null && !isNaN(curr)) {
    units = Math.round((curr - prev) * 100) / 100;
    if (units < 0) isNegative = true;
    if (units > 50) isHigh = true;
  }

  const recordedCount = items.filter((i) => i.is_recorded).length;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Top Bar for Mobile */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            โหมดเดินจดสนาม (Field Reader Mode)
          </span>
          <div className="text-sm font-bold text-slate-800 mt-1">
            รอบบิล: {formatPeriodKey(currentPeriod)}
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('meter')}
          className="text-xs text-sky-600 font-semibold hover:underline"
        >
          กลับหน้าตารางปกติ
        </button>
      </div>

      {/* Zone selection & Progress */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-700">เลือกสายเดินจด:</label>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">ทุกสาย / ทั้งหมด</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between items-center text-xs text-slate-600 mb-1">
            <span>ความคืบหน้า: จดแล้ว {recordedCount} / {items.length} หลัง</span>
            <span className="font-bold text-sky-600">
              {items.length > 0 ? Math.round((recordedCount / items.length) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${items.length > 0 ? (recordedCount / items.length) * 100 : 0}%`
              }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
          กำลังโหลดข้อมูลสนาม...
        </div>
      ) : !currentItem ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
          ไม่พบรายการมิเตอร์ในสายนี้
        </div>
      ) : (
        /* Reading Card */
        <div className="bg-white rounded-2xl border-2 border-sky-600 shadow-md overflow-hidden">
          {/* Card Top / Header */}
          <div className="bg-gradient-to-r from-sky-600 to-cyan-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
                หลังที่ {currentIndex + 1} / {items.length}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                currentItem.is_recorded ? 'bg-emerald-400 text-emerald-950' : 'bg-white/20 text-white'
              }`}>
                {currentItem.is_recorded ? '✓ จดแล้ว' : 'ยังไม่ได้จด'}
              </span>
            </div>

            <div className="mt-2">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span>{currentItem.name}</span>
                <span className="text-xs font-mono text-sky-200 font-normal">({currentItem.user_code})</span>
              </h3>
              <p className="text-xs text-sky-100 flex items-center gap-1 mt-1">
                <Home className="w-3.5 h-3.5" />
                <span>บ้านเลขที่ {currentItem.house_no} {currentItem.village_no} • {currentItem.zone}</span>
              </p>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-5 space-y-4">
            {/* Meter Serial & Previous Reading Display */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500 block">หมายเลขมิเตอร์</span>
                <span className="font-mono font-bold text-sm text-slate-800 flex items-center gap-1 mt-0.5">
                  <Gauge className="w-4 h-4 text-sky-600" />
                  {currentItem.meter_number}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">เลขมิเตอร์ครั้งก่อน</span>
                <span className="font-mono font-bold text-lg text-slate-700">
                  {formatNumber(prev)}
                </span>
              </div>
            </div>

            {/* Input for Current Reading */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex justify-between">
                <span>ป้อนเลขหน้าปัดครั้งนี้</span>
                {units !== null && !isNegative && (
                  <span className="text-sky-600 font-bold">
                    = ใช้ไป {formatNumber(units)} หน่วย (คิว)
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={currentInput}
                  onChange={(e) => {
                    setCurrentInput(e.target.value);
                    setSavedSuccess(false);
                  }}
                  placeholder="0000"
                  className={`w-full text-center font-mono font-bold text-3xl py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                    isNegative
                      ? 'border-red-500 bg-red-50 text-red-700 focus:ring-red-200'
                      : isHigh
                      ? 'border-amber-500 bg-amber-50 text-amber-900 focus:ring-amber-200'
                      : savedSuccess
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 focus:ring-emerald-200'
                      : 'border-sky-500 text-slate-800 focus:ring-sky-200'
                  }`}
                />
              </div>

              {isNegative && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold mt-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>เลขครั้งนี้ต้องไม่น้อยกว่าเลขครั้งก่อน ({prev})</span>
                </div>
              )}
              {isHigh && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold mt-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>ใช้น้ำสูงผิดปกติ ({units} คิว) กรุณาตรวจสอบหน้าปัด</span>
                </div>
              )}
            </div>

            {/* Notes input */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                หมายเหตุเพิ่มเติม (ถ้ามี)
              </label>
              <input
                type="text"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="เช่น ท่อรั่ว, ติดฝ้า, หมาดุ..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Save & Advance Button */}
            <button
              onClick={handleSaveAndNext}
              disabled={saving || isNegative || currentInput === ''}
              className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-md transition-all ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/30'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {saving ? (
                <span>กำลังบันทึก...</span>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5 animate-bounce" />
                  <span>บันทึกแล้ว! กำลังไปหลังถัดไป...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>บันทึกและไปบ้านถัดไป</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Card Navigation Footer */}
          <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={() => handleSelectIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>ก่อนหน้า</span>
            </button>

            <span className="text-xs text-slate-500 font-mono">
              {currentIndex + 1} / {items.length}
            </span>

            <button
              onClick={() => handleSelectIndex(currentIndex + 1)}
              disabled={currentIndex === items.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-30"
            >
              <span>ถัดไป</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
