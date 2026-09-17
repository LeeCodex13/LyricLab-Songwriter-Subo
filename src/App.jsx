import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import WaterUsers from './components/WaterUsers';
import MeterReading from './components/MeterReading';
import MobileFieldReader from './components/MobileFieldReader';
import BillingManagement from './components/BillingManagement';
import Reports from './components/Reports';
import SettingsModal from './components/SettingsModal';
import UserDetailModal from './components/UserDetailModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentPeriod, setCurrentPeriod] = useState('2026-09');
  const [periods, setPeriods] = useState([
    { period_key: '2026-09', period_month: 9, period_year: 2569 },
    { period_key: '2026-08', period_month: 8, period_year: 2569 },
    { period_key: '2026-07', period_month: 7, period_year: 2569 },
    { period_key: '2026-06', period_month: 6, period_year: 2569 },
    { period_key: '2026-05', period_month: 5, period_year: 2569 },
    { period_key: '2026-04', period_month: 4, period_year: 2569 }
  ]);

  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [zones, setZones] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Filters for WaterUsers tab
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detailUserId, setDetailUserId] = useState(null);

  // 1. Fetch Periods
  const fetchPeriods = async () => {
    try {
      const res = await fetch('/api/readings/periods');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setPeriods(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Fetch Settings
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Fetch Zones
  const fetchZones = async () => {
    try {
      const res = await fetch('/api/users/zones');
      const data = await res.json();
      if (data.success) {
        setZones(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Fetch Dashboard
  const fetchDashboard = async () => {
    try {
      const res = await fetch(`/api/dashboard?period=${currentPeriod}`);
      const data = await res.json();
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Fetch Users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      let url = '/api/users?';
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedZone !== 'all') params.append('zone', selectedZone);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const res = await fetch(url + params.toString());
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
    fetchSettings();
    fetchZones();
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [currentPeriod]);

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, selectedZone, selectedCategory, selectedStatus]);

  // CRUD User Handlers
  const handleAddUser = async (formData) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        fetchDashboard();
        fetchZones();
      } else {
        alert(data.error || 'เพิ่มผู้ใช้น้ำไม่สำเร็จ');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเพิ่มผู้ใช้น้ำ');
    }
  };

  const handleEditUser = async (id, formData) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        fetchDashboard();
      } else {
        alert(data.error || 'แก้ไขข้อมูลไม่สำเร็จ');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        fetchDashboard();
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const handleToggleStatus = async (id, newStatus) => {
    try {
      await fetch(`/api/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchUsers();
      fetchDashboard();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (newSettings) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    const data = await res.json();
    if (data.success) {
      setSettings(data.data);
      fetchDashboard();
    }
  };

  const handleResetDemo = async () => {
    const res = await fetch('/api/settings/reset-demo', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert('รีเซ็ตและสร้างข้อมูลตัวอย่างสำเร็จ!');
      setSettingsOpen(false);
      fetchDashboard();
      fetchUsers();
      fetchZones();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentPeriod={currentPeriod}
        setCurrentPeriod={setCurrentPeriod}
        periods={periods}
        onOpenSettings={() => setSettingsOpen(true)}
        orgName={settings?.org_name}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            data={dashboardData}
            currentPeriod={currentPeriod}
            onNavigateTab={setActiveTab}
            onAddUser={() => setActiveTab('users')}
            onSelectUserForDetail={(id) => setDetailUserId(id)}
            onRefresh={fetchDashboard}
          />
        )}

        {activeTab === 'users' && (
          <WaterUsers
            users={users}
            zones={zones}
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            onToggleStatus={handleToggleStatus}
            onViewDetails={(id) => setDetailUserId(id)}
            loading={loadingUsers}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedZone={selectedZone}
            setSelectedZone={setSelectedZone}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
          />
        )}

        {activeTab === 'meter' && (
          <MeterReading
            currentPeriod={currentPeriod}
            zones={zones}
            onNavigateTab={setActiveTab}
            onViewDetails={(id) => setDetailUserId(id)}
          />
        )}

        {activeTab === 'mobile-meter' && (
          <MobileFieldReader
            currentPeriod={currentPeriod}
            zones={zones}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'bills' && (
          <BillingManagement
            currentPeriod={currentPeriod}
            zones={zones}
          />
        )}

        {activeTab === 'reports' && (
          <Reports
            currentPeriod={currentPeriod}
            periods={periods}
          />
        )}
      </main>

      {/* Footer (Not printed) */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{settings?.org_name || 'ระบบบริหารจัดการและจัดเก็บข้อมูลผู้ใช้น้ำประปา'} &copy; 2026</span>
          <span className="text-slate-400">Smart WaterWorks Utility Management System</span>
        </div>
      </footer>

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSaveSettings={handleSaveSettings}
          onResetDemo={handleResetDemo}
        />
      )}

      {/* User Details & History Modal */}
      {detailUserId && (
        <UserDetailModal
          userId={detailUserId}
          onClose={() => setDetailUserId(null)}
          onEdit={() => {}}
        />
      )}
    </div>
  );
}
