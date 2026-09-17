import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Smartphone,
  Eye,
  Camera,
  Check
} from 'lucide-react';
import {
  formatNumber,
  formatPeriodKey,
  CATEGORY_LABELS
} from '../utils/formatters';

export default function MeterReading({
  currentPeriod,
  zones,
  onNavigateTab,
  onSaveReading,
  onSaveBatchReadings,
  onViewDetails
}) {
  const [selectedZone, setSelectedZone] = useState('all');
  const [filterRecorded, setFilterRecorded] = useState('all'); // all, unrecorded, recorded
  const [sheetData, setSheetData] = useState([]);
  const [readingsState, setReadingsState] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch sheet data whenever period or zone changes
  const fetchSheet = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let url = `/api/readings/sheet?period=${currentPeriod}`;
      if (selectedZone !== 'all') {
        url += `&zone=${encodeURIComponent(selectedZone)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setSheetData(data.data);

        // Prepopulate input values
        const initialMap = {};
        for (const row of data.data) {
          initialMap[row.user_id] = {
            current_reading: row.current_reading !== null ? String(row.current_reading) : '',
            notes: row.notes || '',
            reader_name: row.reader_name || 'นายสมหมาย พิทักษ์น้ำ',
            saved: row.is_recorded
          };
        }
        setReadingsState(initialMap);
      }
    } catch (err) {
      console.error('Error fetching sheet:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการโหลดรายการจดมิเตอร์');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheet();
  }, [currentPeriod, selectedZone]);

  const handleInputChange = (userId, value) => {
    setReadingsState((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        current_reading: value,
        saved: false
      }
    }));
  };

  const handleNotesChange = (userId, value) => {
    setReadingsState((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        notes: value,
        saved: false
      }
    }));
  };

  // Save single row
  const handleSaveSingle = async (row) => {
    const state = readingsState[row.user_id];
    if (!state || state.current_reading === '') {
      alert('กรุณากรอกเลขมิเตอร์ครั้งนี้');
      return;
    }

    const prev = parseFloat(row.previous_reading) || 0;
    const curr = parseFloat(state.current_reading) || 0;

    if (curr < prev) {
      alert(`เลขมิเตอร์ครั้งนี้ (${curr}) ต้องไม่น้อยกว่าครั้งก่อน (${prev})`);
      return;
    }

    try {
      const res = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: row.user_id,
          period_key: currentPeriod,
          read_date: new Date().toISOString().split('T')[0],
          previous_reading: prev,
          current_reading: curr,
          reader_name: state.reader_name || 'นายสมหมาย พิทักษ์น้ำ',
          notes: state.notes || ''
        })
      });
      const json = await res.json();
      if (json.success) {
        setReadingsState((prevMap) => ({
          ...prevMap,
          [row.user_id]: {
            ...prevMap[row.user_id],
            saved: true
          }
        }));
        setSuccessMsg(`บันทึกมิเตอร์ ${row.user_code} (${row.name}) เรียบร้อยแล้ว`);
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchSheet();
      } else {
        alert(json.error || 'บันทึกไม่สำเร็จ');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  // Save all modified rows
  const handleSaveAllBatch = async () => {
    const toSave = [];

    for (const row of sheetData) {
      const state = readingsState[row.user_id];
      if (state && state.current_reading !== '' && !state.saved) {
        const prev = parseFloat(row.previous_reading) || 0;
        const curr = parseFloat(state.current_reading) || 0;
        if (curr >= prev) {
          toSave.push({
            user_id: row.user_id,
            previous_reading: prev,
            current_reading: curr,
            read_date: new Date().toISOString().split('T')[0],
            reader_name: state.reader_name || 'นายสมหมาย พิทักษ์น้ำ',
            notes: state.notes || ''
          });
        }
      }
    }

    if (toSave.length === 0) {
      alert('ไม่มีรายการที่แก้ไขหรือยังไม่ได้บันทึก');
      return;
    }

    setSavingBatch(true);
    try {
      const res = await fetch('/api/readings/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_key: currentPeriod,
          readings: toSave
        })
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchSheet();
      } else {
        alert(json.error || 'บันทึกไม่สำเร็จ');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด');
    } finally {
      setSavingBatch(false);
    }
  };

  // Filter rows based on recorded filter
  const filteredRows = sheetData.filter((row) => {
    if (filterRecorded === 'recorded') return row.is_recorded;
    if (filterRecorded === 'unrecorded') return !row.is_recorded;
    return true;
  });

  const totalInSheet = sheetData.length;
  const recordedCount = sheetData.filter((r) => r.is_recorded).length;
  const unrecordedCount = totalInSheet - recordedCount;
  const percent = totalInSheet > 0 ? Math.round((recordedCount / totalInSheet) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-sky-100 text-sky-700">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                ตารางบันทึกการอ่านมิเตอร์น้ำประจำเดือน: {formatPeriodKey(currentPeriod)}
              </h2>
              <p className="text-xs text-slate-500">
                จดเลขหน้าปัดมิเตอร์ คำนวณปริมาณการใช้น้ำ และสร้างบิลค่าน้ำอัตโนมัติ
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Switch to Mobile Field Reader Mode */}
          <button
            onClick={() => onNavigateTab('mobile-meter')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-sm"
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>โหมดเดินจดสนาม (Mobile View)</span>
          </button>

          {/* Batch Save All Button */}
          <button
            onClick={handleSaveAllBatch}
            disabled={savingBatch}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/30 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{savingBatch ? 'กำลังบันทึก...' : 'บันทึกข้อมูลทั้งหมด'}</span>
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Stats Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Zone Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">สาย / โซน:</span>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg font-medium text-xs bg-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">ทุกสาย / ทุกโซน</option>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">สถานะ:</span>
            <select
              value={filterRecorded}
              onChange={(e) => setFilterRecorded(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg font-medium text-xs bg-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">ทั้งหมด ({totalInSheet})</option>
              <option value="unrecorded">ยังไม่ได้จด ({unrecordedCount})</option>
              <option value="recorded">จดแล้ว ({recordedCount})</option>
            </select>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-3 text-xs">
          <div className="text-right">
            <div className="font-semibold text-slate-700">
              จดแล้ว {recordedCount} / {totalInSheet} หลัง ({percent}%)
            </div>
            <div className="text-[11px] text-slate-400">
              เหลืออีก {unrecordedCount} หลัง
            </div>
          </div>
          <div className="w-24 bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-sky-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Meter Reading Sheet Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12">ลำดับ</th>
                <th className="py-3 px-3">รหัส / ผู้ใช้น้ำ</th>
                <th className="py-3 px-3">ที่อยู่ / โซน</th>
                <th className="py-3 px-3">เลขมิเตอร์</th>
                <th className="py-3 px-3 text-right">เลขครั้งก่อน</th>
                <th className="py-3 px-3 w-40 text-center">
                  <span className="text-sky-700">เลขครั้งนี้</span>
                </th>
                <th className="py-3 px-3 text-right">หน่วยที่ใช้</th>
                <th className="py-3 px-3">หมายเหตุ / สถานะ</th>
                <th className="py-3 px-3 text-center w-24">บันทึก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    กำลังโหลดข้อมูลตารางจดมิเตอร์...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    ไม่มีรายการมิเตอร์ที่ตรงกับตัวกรอง
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const state = readingsState[row.user_id] || { current_reading: '', notes: '', saved: false };
                  const prev = parseFloat(row.previous_reading) || 0;
                  const currStr = state.current_reading;
                  const curr = currStr !== '' ? parseFloat(currStr) : null;

                  let units = null;
                  let isNegative = false;
                  let isHigh = false;

                  if (curr !== null && !isNaN(curr)) {
                    units = Math.round((curr - prev) * 100) / 100;
                    if (units < 0) isNegative = true;
                    if (units > 50 || (row.avg_units && units > row.avg_units * 2)) isHigh = true;
                  }

                  const isSaved = state.saved || row.is_recorded;

                  return (
                    <tr
                      key={row.user_id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSaved ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      {/* Seq */}
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>

                      {/* User Info */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-sky-700 bg-sky-50 px-1 py-0.5 rounded text-[10px]">
                            {row.user_code}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-800 text-xs mt-0.5">
                          {row.name}
                        </div>
                      </td>

                      {/* Address */}
                      <td className="py-3 px-3">
                        <div className="text-slate-800">
                          {row.house_no} {row.village_no}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {row.zone}
                        </div>
                      </td>

                      {/* Meter Number */}
                      <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                        {row.meter_number}
                      </td>

                      {/* Previous Reading */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-600 bg-slate-50/50">
                        {formatNumber(prev)}
                      </td>

                      {/* Current Reading Input */}
                      <td className="py-3 px-3">
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            value={state.current_reading}
                            onChange={(e) => handleInputChange(row.user_id, e.target.value)}
                            placeholder="ป้อนเลขครั้งนี้"
                            className={`w-full text-right font-mono font-bold px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
                              isNegative
                                ? 'border-red-500 bg-red-50 text-red-700 focus:ring-red-400'
                                : isHigh
                                ? 'border-amber-500 bg-amber-50 text-amber-900 focus:ring-amber-400'
                                : isSaved
                                ? 'border-emerald-300 bg-emerald-50/40 text-emerald-900 focus:ring-emerald-400'
                                : 'border-slate-300 focus:ring-sky-500'
                            }`}
                          />
                        </div>
                        {isNegative && (
                          <div className="text-[10px] text-red-600 font-bold mt-0.5 text-right">
                            * น้อยกว่าครั้งก่อน!
                          </div>
                        )}
                        {isHigh && (
                          <div className="text-[10px] text-amber-600 font-bold mt-0.5 text-right">
                            * ใช้น้ำสูงผิดปกติ
                          </div>
                        )}
                      </td>

                      {/* Units Used */}
                      <td className="py-3 px-3 text-right">
                        {units !== null ? (
                          <div>
                            <span
                              className={`font-mono font-bold text-sm ${
                                isNegative
                                  ? 'text-red-600'
                                  : isHigh
                                  ? 'text-amber-600'
                                  : 'text-sky-700'
                              }`}
                            >
                              {formatNumber(units)}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">คิว</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono">-</span>
                        )}
                      </td>

                      {/* Notes / Anomaly */}
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={state.notes}
                          onChange={(e) => handleNotesChange(row.user_id, e.target.value)}
                          placeholder="หมายเหตุ..."
                          className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </td>

                      {/* Save Button */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleSaveSingle(row)}
                          disabled={isNegative}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 mx-auto transition-all ${
                            isSaved
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm'
                          } disabled:opacity-30`}
                        >
                          {isSaved ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>บันทึกแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>บันทึก</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
