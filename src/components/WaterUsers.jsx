import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Download,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Phone,
  Home,
  Gauge,
  Tag,
  MapPin,
  X,
  FileSpreadsheet
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  formatCurrency,
  formatNumber,
  formatThaiDate
} from '../utils/formatters';

export default function WaterUsers({
  users,
  zones,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onToggleStatus,
  onViewDetails,
  loading,
  searchQuery,
  setSearchQuery,
  selectedZone,
  setSelectedZone,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus
}) {
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    user_code: '',
    name: '',
    id_card: '',
    phone: '',
    house_no: '',
    village_no: 'หมู่ 1',
    subdistrict: 'ตำบลน้ำใส',
    district: 'อำเภอเมือง',
    province: 'เชียงใหม่',
    zone: zones[0] || 'สายที่ 1 (โซนเหนือ)',
    meter_number: '',
    meter_size: '1/2 นิ้ว (4 หุน)',
    category: 'residential',
    status: 'active',
    initial_reading: '0',
    install_date: new Date().toISOString().split('T')[0],
    notes: '',
    latitude: '',
    longitude: ''
  });

  const handleOpenAdd = () => {
    // Generate next user_code
    let nextCode = 'W-1001';
    if (users && users.length > 0) {
      const numbers = users
        .map((u) => {
          const match = u.user_code.match(/W-(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(Boolean);
      const maxNum = Math.max(...numbers, 1000);
      nextCode = `W-${maxNum + 1}`;
    }

    setFormData({
      user_code: nextCode,
      name: '',
      id_card: '',
      phone: '',
      house_no: '',
      village_no: 'หมู่ 1',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: zones[0] || 'สายที่ 1 (โซนเหนือ)',
      meter_number: `M-${Math.floor(5000 + Math.random() * 4000)}`,
      meter_size: '1/2 นิ้ว (4 หุน)',
      category: 'residential',
      status: 'active',
      initial_reading: '0',
      install_date: new Date().toISOString().split('T')[0],
      notes: '',
      latitude: '',
      longitude: ''
    });
    setEditingUser(null);
    setUserModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      user_code: user.user_code,
      name: user.name,
      id_card: user.id_card || '',
      phone: user.phone || '',
      house_no: user.house_no,
      village_no: user.village_no || 'หมู่ 1',
      subdistrict: user.subdistrict || 'ตำบลน้ำใส',
      district: user.district || 'อำเภอเมือง',
      province: user.province || 'เชียงใหม่',
      zone: user.zone,
      meter_number: user.meter_number,
      meter_size: user.meter_size || '1/2 นิ้ว (4 หุน)',
      category: user.category || 'residential',
      status: user.status || 'active',
      initial_reading: String(user.initial_reading || 0),
      install_date: user.install_date || '',
      notes: user.notes || '',
      latitude: user.latitude ? String(user.latitude) : '',
      longitude: user.longitude ? String(user.longitude) : ''
    });
    setUserModalOpen(true);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (editingUser) {
      onEditUser(editingUser.id, formData);
    } else {
      onAddUser(formData);
    }
    setUserModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            <span>ทะเบียนผู้ใช้น้ำทั้งหมด ({users.length} ราย)</span>
          </h2>
          <p className="text-xs text-slate-500">จัดการรายชื่อ ข้อมูลมิเตอร์ และประวัติการใช้น้ำ</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV */}
          <a
            href="/api/export/users.csv"
            download
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>ส่งออก CSV</span>
          </a>

          {/* Add User Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/30 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ เพิ่มผู้ใช้น้ำใหม่</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="md:col-span-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, รหัส, บ้านเลขที่, เลขมิเตอร์..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          {/* Zone Filter */}
          <div>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="all">ทุกสาย / ทุกโซน</option>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="all">ทุกประเภทผู้ใช้น้ำ</option>
              <option value="residential">บ้านพักอาศัย</option>
              <option value="commercial">ธุรกิจ / ร้านค้า</option>
              <option value="government">ราชการ / วัด / โรงเรียน</option>
              <option value="agriculture">เกษตรกรรม / ฟาร์ม</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="active">ปกติ (ใช้งานอยู่)</option>
              <option value="suspended">ระงับการใช้น้ำชั่วคราว</option>
              <option value="terminated">ยกเลิกการใช้น้ำ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">รหัส / ชื่อผู้ใช้น้ำ</th>
                <th className="py-3 px-4">ที่อยู่ / โซน</th>
                <th className="py-3 px-4">หมายเลขมิเตอร์</th>
                <th className="py-3 px-4">ประเภท</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-right">มิเตอร์ล่าสุด</th>
                <th className="py-3 px-4 text-center">บิลเดือนนี้</th>
                <th className="py-3 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400">
                    กำลังโหลดข้อมูลผู้ใช้น้ำ...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium">ไม่พบข้อมูลผู้ใช้น้ำที่ตรงกับเงื่อนไขการค้นหา</p>
                    <button
                      onClick={handleOpenAdd}
                      className="mt-2 text-xs text-sky-600 font-semibold hover:underline"
                    >
                      + เพิ่มผู้ใช้น้ำรายใหม่
                    </button>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const cat = CATEGORY_LABELS[user.category] || { label: user.category, badge: '' };
                  const stat = STATUS_LABELS[user.status] || { label: user.status, badge: '' };
                  const billStat = PAYMENT_STATUS_LABELS[user.currentBillStatus] || null;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Code */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded text-[11px]">
                            {user.user_code}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-800 mt-0.5 text-xs">
                          {user.name}
                        </div>
                        {user.phone && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Address & Zone */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">
                          บ้านเลขที่ {user.house_no} {user.village_no}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {user.zone}
                        </div>
                      </td>

                      {/* Meter Info */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-700 flex items-center gap-1">
                          <Gauge className="w-3.5 h-3.5 text-sky-600" />
                          <span>{user.meter_number}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          ขนาด {user.meter_size}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${cat.badge}`}>
                          {cat.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${stat.badge}`}>
                          {stat.label}
                        </span>
                      </td>

                      {/* Last Reading */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-bold text-slate-800">
                          {formatNumber(user.lastMeterReading)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          ใช้น้ำ {formatNumber(user.lastUnitsUsed)} คิว
                        </div>
                      </td>

                      {/* Current Bill Status */}
                      <td className="py-3 px-4 text-center">
                        {billStat ? (
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${billStat.badge}`}>
                              {billStat.label}
                            </span>
                            <div className="text-[10px] text-slate-600 font-semibold mt-0.5">
                              {formatCurrency(user.currentBillAmount)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">ยังไม่มีบิล</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View details */}
                          <button
                            onClick={() => onViewDetails(user.id)}
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="ดูประวัติและข้อมูลเต็ม"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`คุณต้องการลบข้อมูลผู้ใช้น้ำ "${user.name}" (${user.user_code}) ใช่หรือไม่?`)) {
                                onDeleteUser(user.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="ลบข้อมูล"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Add / Edit User Modal */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-sky-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <h3 className="font-bold text-base">
                  {editingUser ? 'แก้ไขข้อมูลผู้ใช้น้ำ' : 'เพิ่มผู้ใช้น้ำรายใหม่'}
                </h3>
              </div>
              <button
                onClick={() => setUserModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* User Code */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รหัสผู้ใช้น้ำ</label>
                  <input
                    type="text"
                    required
                    value={formData.user_code}
                    onChange={(e) => setFormData({ ...formData, user_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="เช่น W-1021"
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ชื่อ-นามสกุล / ชื่อกิจการ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="นายสมชาย ใจดี หรือ ร้านค้า..."
                  />
                </div>

                {/* ID Card */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เลขบัตรประชาชน 13 หลัก</label>
                  <input
                    type="text"
                    maxLength="13"
                    value={formData.id_card}
                    onChange={(e) => setFormData({ ...formData, id_card: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="1509900xxxxxx"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="081-234-5678"
                  />
                </div>

                {/* House No */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    บ้านเลขที่ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.house_no}
                    onChange={(e) => setFormData({ ...formData, house_no: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="เช่น 123/4"
                  />
                </div>

                {/* Village No */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">หมู่ที่</label>
                  <input
                    type="text"
                    value={formData.village_no}
                    onChange={(e) => setFormData({ ...formData, village_no: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="เช่น หมู่ 1"
                  />
                </div>

                {/* Zone / Walk Route */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">สายการจด / โซน</label>
                  <input
                    type="text"
                    list="zone-suggestions"
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="ระบุชื่อสายหรือเลือกจากตัวเลือก"
                  />
                  <datalist id="zone-suggestions">
                    {zones.map((z) => (
                      <option key={z} value={z} />
                    ))}
                  </datalist>
                </div>

                {/* Category */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ประเภทผู้ใช้น้ำ</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="residential">บ้านพักอาศัย (Residential)</option>
                    <option value="commercial">ธุรกิจ / ร้านค้า (Commercial)</option>
                    <option value="government">สถานที่ราชการ / วัด / โรงเรียน</option>
                    <option value="agriculture">เกษตรกรรม / ฟาร์ม</option>
                  </select>
                </div>

                {/* Meter Number */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    หมายเลขมิเตอร์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.meter_number}
                    onChange={(e) => setFormData({ ...formData, meter_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="เช่น M-5012"
                  />
                </div>

                {/* Meter Size */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ขนาดท่อ / มิเตอร์</label>
                  <select
                    value={formData.meter_size}
                    onChange={(e) => setFormData({ ...formData, meter_size: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="1/2 นิ้ว (4 หุน)">1/2 นิ้ว (4 หุน) - มาตรฐานบ้านพัก</option>
                    <option value="3/4 นิ้ว (6 หุน)">3/4 นิ้ว (6 หุน) - ร้านค้า / กิจการ</option>
                    <option value="1 นิ้ว">1 นิ้ว - อาคารใหญ่ / เกษตร</option>
                    <option value="1.5 นิ้ว ขึ้นไป">1.5 นิ้ว ขึ้นไป - โรงงาน</option>
                  </select>
                </div>

                {/* Initial Reading */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เลขมิเตอร์ตั้งต้น</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.initial_reading}
                    onChange={(e) => setFormData({ ...formData, initial_reading: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">สถานะผู้ใช้น้ำ</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="active">ปกติ (ใช้งานอยู่)</option>
                    <option value="suspended">ระงับชั่วคราว</option>
                    <option value="terminated">ยกเลิกการใช้น้ำ</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">หมายเหตุเพิ่มเติม</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="เช่น จุดติดตั้งมิเตอร์อยู่ติดรั้วด้านซ้าย หรือเบอร์ติดต่อสำรอง"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 text-white rounded-lg font-bold hover:bg-sky-700 shadow-md shadow-sky-600/20 transition-all"
                >
                  {editingUser ? 'บันทึกการแก้ไข' : 'ยืนยันเพิ่มผู้ใช้น้ำ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
