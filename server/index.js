const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const {
  db,
  initDb,
  getSettings,
  updateSettings,
  calculateWaterCharge,
  logActivity
} = require('./database');
const { seedData } = require('./seed');
const { generateQRCodeDataURL, generatePromptPayPayload } = require('./promptpay');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDb();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper: current Thai Buddhist Year / Month
function getCurrentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const thaiYear = year + 543;
  return {
    year,
    month,
    thaiYear,
    key: `${year}-${String(month).padStart(2, '0')}`
  };
}

// ----------------------------------------------------
// 1. DASHBOARD & STATS API
// ----------------------------------------------------
app.get('/api/dashboard', (req, res) => {
  try {
    const period = req.query.period || getCurrentPeriod().key;
    const settings = getSettings();

    // User counts
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM water_users').get().count;
    const activeUsers = db.prepare("SELECT COUNT(*) as count FROM water_users WHERE status = 'active'").get().count;
    const suspendedUsers = db.prepare("SELECT COUNT(*) as count FROM water_users WHERE status = 'suspended'").get().count;

    // Current period readings
    const periodReadingsCount = db.prepare(
      'SELECT COUNT(*) as count, COALESCE(SUM(units_used), 0) as total_units FROM meter_readings WHERE period_key = ?'
    ).get(period);

    // Current period bills
    const billStats = db.prepare(`
      SELECT 
        COUNT(*) as total_bills,
        COALESCE(SUM(total_amount), 0) as total_billed,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN paid_amount ELSE 0 END), 0) as total_collected,
        COALESCE(SUM(CASE WHEN payment_status != 'paid' THEN total_amount ELSE 0 END), 0) as total_unpaid,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END), 0) as paid_bills_count,
        COALESCE(SUM(CASE WHEN payment_status != 'paid' THEN 1 ELSE 0 END), 0) as unpaid_bills_count
      FROM bills WHERE period_key = ?
    `).get(period);

    // Overdue bills (across all past periods)
    const overdueStats = db.prepare(`
      SELECT COUNT(*) as overdue_count, COALESCE(SUM(total_amount), 0) as overdue_amount
      FROM bills
      WHERE payment_status = 'overdue' OR (payment_status = 'unpaid' AND period_key < ?)
    `).get(period);

    // Anomalies count in this period
    const anomalies = db.prepare(`
      SELECT r.*, u.name as user_name, u.user_code, u.house_no, u.meter_number, u.zone
      FROM meter_readings r
      JOIN water_users u ON r.user_id = u.id
      WHERE r.period_key = ? AND r.anomaly_flag != 'normal'
    `).all(period);

    // 6-Month historical trend
    const historicalTrends = db.prepare(`
      SELECT 
        b.period_key,
        COALESCE(SUM(b.units_used), 0) as total_units,
        COALESCE(SUM(b.total_amount), 0) as billed_amount,
        COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.paid_amount ELSE 0 END), 0) as collected_amount
      FROM bills b
      GROUP BY b.period_key
      ORDER BY b.period_key DESC
      LIMIT 6
    `).all().reverse();

    // Category breakdown
    const categoryBreakdown = db.prepare(`
      SELECT 
        category,
        COUNT(*) as user_count,
        COALESCE(SUM(b.units_used), 0) as total_units,
        COALESCE(SUM(b.total_amount), 0) as total_revenue
      FROM water_users u
      LEFT JOIN bills b ON u.id = b.user_id AND b.period_key = ?
      GROUP BY category
    `).all(period);

    // Recent activity logs
    const recentLogs = db.prepare('SELECT * FROM activity_logs ORDER BY id DESC LIMIT 8').all();

    res.json({
      success: true,
      data: {
        period,
        settings,
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
          unrecordedInPeriod: Math.max(0, activeUsers - (periodReadingsCount.count || 0))
        },
        readings: {
          recordedCount: periodReadingsCount.count,
          totalUnits: periodReadingsCount.total_units,
          completionPercent: activeUsers > 0 ? Math.round((periodReadingsCount.count / activeUsers) * 100) : 0
        },
        financials: {
          totalBilled: billStats.total_billed,
          totalCollected: billStats.total_collected,
          totalUnpaid: billStats.total_unpaid,
          paidCount: billStats.paid_bills_count,
          unpaidCount: billStats.unpaid_bills_count,
          collectionRate: billStats.total_billed > 0 ? Math.round((billStats.total_collected / billStats.total_billed) * 100) : 0,
          overdueCount: overdueStats.overdue_count,
          overdueAmount: overdueStats.overdue_amount
        },
        anomalies,
        historicalTrends,
        categoryBreakdown,
        recentLogs
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 2. WATER USERS API
// ----------------------------------------------------
app.get('/api/users', (req, res) => {
  try {
    const { search, zone, category, status } = req.query;
    let query = 'SELECT * FROM water_users WHERE 1=1';
    const params = [];

    if (search) {
      query += ` AND (
        user_code LIKE ? OR
        name LIKE ? OR
        phone LIKE ? OR
        house_no LIKE ? OR
        meter_number LIKE ?
      )`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    if (zone && zone !== 'all') {
      query += ' AND zone = ?';
      params.push(zone);
    }

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY user_code ASC';

    const users = db.prepare(query).all(...params);

    // Get current period key
    const currentPeriod = getCurrentPeriod().key;

    // Attach latest reading and bill info for convenience
    const enrichedUsers = users.map(u => {
      const latestReading = db.prepare(
        'SELECT current_reading, read_date, units_used FROM meter_readings WHERE user_id = ? ORDER BY period_key DESC LIMIT 1'
      ).get(u.id);

      const latestBill = db.prepare(
        'SELECT payment_status, total_amount, due_date, bill_no FROM bills WHERE user_id = ? AND period_key = ?'
      ).get(u.id, currentPeriod);

      const totalUnpaid = db.prepare(
        "SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as amount FROM bills WHERE user_id = ? AND payment_status != 'paid'"
      ).get(u.id);

      return {
        ...u,
        lastMeterReading: latestReading ? latestReading.current_reading : u.initial_reading,
        lastReadingDate: latestReading ? latestReading.read_date : u.install_date,
        lastUnitsUsed: latestReading ? latestReading.units_used : 0,
        currentBillStatus: latestBill ? latestBill.payment_status : 'none',
        currentBillAmount: latestBill ? latestBill.total_amount : 0,
        currentBillNo: latestBill ? latestBill.bill_no : null,
        unpaidBillsCount: totalUnpaid.count,
        unpaidAmount: totalUnpaid.amount
      };
    });

    res.json({ success: true, data: enrichedUsers });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/users/zones', (req, res) => {
  try {
    const zones = db.prepare('SELECT DISTINCT zone FROM water_users ORDER BY zone ASC').all().map(r => r.zone);
    res.json({ success: true, data: zones });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/users/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM water_users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลผู้ใช้น้ำ' });
    }

    // Readings history
    const readings = db.prepare(
      'SELECT * FROM meter_readings WHERE user_id = ? ORDER BY period_key DESC'
    ).all(user.id);

    // Bills history
    const bills = db.prepare(
      'SELECT * FROM bills WHERE user_id = ? ORDER BY period_key DESC'
    ).all(user.id);

    res.json({
      success: true,
      data: {
        ...user,
        readings,
        bills
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.name || !data.house_no || !data.meter_number) {
      return res.status(400).json({ success: false, error: 'กรุณากรอกชื่อ, บ้านเลขที่ และเลขมิเตอร์' });
    }

    // Auto-generate user_code if not supplied
    let user_code = data.user_code;
    if (!user_code) {
      const lastUser = db.prepare("SELECT user_code FROM water_users WHERE user_code LIKE 'W-%' ORDER BY id DESC LIMIT 1").get();
      if (lastUser && lastUser.user_code) {
        const lastNum = parseInt(lastUser.user_code.replace('W-', ''), 10);
        user_code = `W-${lastNum + 1}`;
      } else {
        user_code = 'W-1001';
      }
    }

    // Check meter_number unique
    const existingMeter = db.prepare('SELECT id FROM water_users WHERE meter_number = ?').get(data.meter_number);
    if (existingMeter) {
      return res.status(400).json({ success: false, error: 'หมายเลขมิเตอร์นี้ถูกใช้งานแล้วในระบบ' });
    }

    // Check user_code unique
    const existingCode = db.prepare('SELECT id FROM water_users WHERE user_code = ?').get(user_code);
    if (existingCode) {
      return res.status(400).json({ success: false, error: 'รหัสผู้ใช้น้ำนี้มีอยู่ในระบบแล้ว' });
    }

    const insert = db.prepare(`
      INSERT INTO water_users (
        user_code, name, id_card, phone, house_no, village_no,
        subdistrict, district, province, zone, meter_number, meter_size,
        category, status, initial_reading, install_date, notes, latitude, longitude
      ) VALUES (
        @user_code, @name, @id_card, @phone, @house_no, @village_no,
        @subdistrict, @district, @province, @zone, @meter_number, @meter_size,
        @category, @status, @initial_reading, @install_date, @notes, @latitude, @longitude
      )
    `);

    const result = insert.run({
      user_code,
      name: data.name,
      id_card: data.id_card || '',
      phone: data.phone || '',
      house_no: data.house_no,
      village_no: data.village_no || 'หมู่ 1',
      subdistrict: data.subdistrict || 'ตำบลน้ำใส',
      district: data.district || 'อำเภอเมือง',
      province: data.province || 'เชียงใหม่',
      zone: data.zone || 'สายที่ 1 (โซนเหนือ)',
      meter_number: data.meter_number,
      meter_size: data.meter_size || '1/2 นิ้ว (4 หุน)',
      category: data.category || 'residential',
      status: data.status || 'active',
      initial_reading: parseFloat(data.initial_reading) || 0,
      install_date: data.install_date || new Date().toISOString().split('T')[0],
      notes: data.notes || '',
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null
    });

    logActivity('USER_ADD', `เพิ่มผู้ใช้น้ำใหม่: ${data.name} (${user_code})`, user_code);

    res.json({
      success: true,
      message: 'บันทึกข้อมูลผู้ใช้น้ำเรียบร้อยแล้ว',
      data: { id: result.lastInsertRowid, user_code }
    });
  } catch (err) {
    console.error('Error adding user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    // Check user exists
    const user = db.prepare('SELECT * FROM water_users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'ไม่พบผู้ใช้น้ำ' });
    }

    // Check meter uniqueness
    if (data.meter_number && data.meter_number !== user.meter_number) {
      const checkMeter = db.prepare('SELECT id FROM water_users WHERE meter_number = ? AND id != ?').get(data.meter_number, id);
      if (checkMeter) {
        return res.status(400).json({ success: false, error: 'หมายเลขมิเตอร์นี้ถูกใช้งานโดยผู้ใช้อื่นแล้ว' });
      }
    }

    const update = db.prepare(`
      UPDATE water_users SET
        name = @name,
        id_card = @id_card,
        phone = @phone,
        house_no = @house_no,
        village_no = @village_no,
        subdistrict = @subdistrict,
        district = @district,
        province = @province,
        zone = @zone,
        meter_number = @meter_number,
        meter_size = @meter_size,
        category = @category,
        status = @status,
        initial_reading = @initial_reading,
        install_date = @install_date,
        notes = @notes,
        latitude = @latitude,
        longitude = @longitude,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `);

    update.run({
      id,
      name: data.name || user.name,
      id_card: data.id_card !== undefined ? data.id_card : user.id_card,
      phone: data.phone !== undefined ? data.phone : user.phone,
      house_no: data.house_no || user.house_no,
      village_no: data.village_no || user.village_no,
      subdistrict: data.subdistrict || user.subdistrict,
      district: data.district || user.district,
      province: data.province || user.province,
      zone: data.zone || user.zone,
      meter_number: data.meter_number || user.meter_number,
      meter_size: data.meter_size || user.meter_size,
      category: data.category || user.category,
      status: data.status || user.status,
      initial_reading: data.initial_reading !== undefined ? parseFloat(data.initial_reading) : user.initial_reading,
      install_date: data.install_date || user.install_date,
      notes: data.notes !== undefined ? data.notes : user.notes,
      latitude: data.latitude ? parseFloat(data.latitude) : user.latitude,
      longitude: data.longitude ? parseFloat(data.longitude) : user.longitude
    });

    logActivity('USER_UPDATE', `แก้ไขข้อมูลผู้ใช้น้ำ: ${user.user_code} - ${data.name || user.name}`, user.user_code);

    res.json({ success: true, message: 'แก้ไขข้อมูลผู้ใช้น้ำเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/users/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const user = db.prepare('SELECT user_code, name FROM water_users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'ไม่พบผู้ใช้น้ำ' });

    db.prepare('UPDATE water_users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
    logActivity('USER_STATUS', `เปลี่ยนสถานะ ${user.user_code} เป็น ${status}`, user.user_code);

    res.json({ success: true, message: 'เปลี่ยนสถานะเรียบร้อยแล้ว' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT user_code, name FROM water_users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'ไม่พบผู้ใช้น้ำ' });

    db.prepare('DELETE FROM water_users WHERE id = ?').run(req.params.id);
    logActivity('USER_DELETE', `ลบผู้ใช้น้ำ: ${user.name} (${user.user_code})`, user.user_code);

    res.json({ success: true, message: 'ลบข้อมูลผู้ใช้น้ำเรียบร้อยแล้ว' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 3. METER READINGS API
// ----------------------------------------------------
app.get('/api/readings/periods', (req, res) => {
  try {
    const periods = db.prepare(`
      SELECT DISTINCT period_key, period_month, period_year
      FROM meter_readings
      ORDER BY period_key DESC
    `).all();

    // Ensure current period is included
    const current = getCurrentPeriod();
    const exists = periods.find(p => p.period_key === current.key);
    if (!exists) {
      periods.unshift({
        period_key: current.key,
        period_month: current.month,
        period_year: current.thaiYear
      });
    }

    res.json({ success: true, data: periods });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Sheet/Batch Reading: gets list of users with previous reading and recorded reading for a specific period & zone
app.get('/api/readings/sheet', (req, res) => {
  try {
    const period = req.query.period || getCurrentPeriod().key;
    const zone = req.query.zone;

    let userQuery = "SELECT * FROM water_users WHERE status != 'terminated'";
    const params = [];
    if (zone && zone !== 'all') {
      userQuery += ' AND zone = ?';
      params.push(zone);
    }
    userQuery += ' ORDER BY zone ASC, user_code ASC';

    const users = db.prepare(userQuery).all(...params);

    const sheetRows = users.map(user => {
      // Find previous reading (from the period right before this one)
      const prevReadingRecord = db.prepare(`
        SELECT current_reading, read_date
        FROM meter_readings
        WHERE user_id = ? AND period_key < ?
        ORDER BY period_key DESC
        LIMIT 1
      `).get(user.id, period);

      const previous_reading = prevReadingRecord ? prevReadingRecord.current_reading : user.initial_reading;

      // Find reading for this period if already recorded
      const currentReadingRecord = db.prepare(`
        SELECT * FROM meter_readings WHERE user_id = ? AND period_key = ?
      `).get(user.id, period);

      // Average 3-month usage for anomaly detection
      const avgUsageRow = db.prepare(`
        SELECT AVG(units_used) as avg_units
        FROM (
          SELECT units_used FROM meter_readings WHERE user_id = ? AND period_key < ? ORDER BY period_key DESC LIMIT 3
        )
      `).get(user.id, period);
      const avgUnits = avgUsageRow ? Math.round(avgUsageRow.avg_units || 15) : 15;

      return {
        user_id: user.id,
        user_code: user.user_code,
        name: user.name,
        house_no: user.house_no,
        village_no: user.village_no,
        zone: user.zone,
        meter_number: user.meter_number,
        category: user.category,
        previous_reading,
        current_reading: currentReadingRecord ? currentReadingRecord.current_reading : null,
        units_used: currentReadingRecord ? currentReadingRecord.units_used : null,
        read_date: currentReadingRecord ? currentReadingRecord.read_date : null,
        reader_name: currentReadingRecord ? currentReadingRecord.reader_name : 'นายสมหมาย พิทักษ์น้ำ',
        photo_url: currentReadingRecord ? currentReadingRecord.photo_url : null,
        anomaly_flag: currentReadingRecord ? currentReadingRecord.anomaly_flag : 'normal',
        notes: currentReadingRecord ? currentReadingRecord.notes : '',
        is_recorded: !!currentReadingRecord,
        avg_units: avgUnits
      };
    });

    res.json({ success: true, data: sheetRows });
  } catch (err) {
    console.error('Error fetching meter reading sheet:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save or update a single meter reading
app.post('/api/readings', (req, res) => {
  try {
    const {
      user_id,
      period_key,
      read_date,
      previous_reading,
      current_reading,
      reader_name,
      photo_url,
      notes
    } = req.body;

    if (!user_id || !period_key || current_reading === undefined || current_reading === null || current_reading === '') {
      return res.status(400).json({ success: false, error: 'ข้อมูลไม่ครบถ้วน' });
    }

    const prev = parseFloat(previous_reading) || 0;
    const curr = parseFloat(current_reading) || 0;

    if (curr < prev) {
      return res.status(400).json({
        success: false,
        error: `เลขมิเตอร์ครั้งนี้ (${curr}) ต้องไม่น้อยกว่าครั้งก่อน (${prev})`
      });
    }

    const units = Math.round((curr - prev) * 100) / 100;
    const [yearStr, monthStr] = period_key.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const thaiYear = year + 543;

    // Detect anomalies
    let anomaly_flag = 'normal';
    if (units === 0) {
      anomaly_flag = 'zero_usage';
    } else if (units > 60) {
      anomaly_flag = 'high_usage';
    }

    // Upsert reading
    const existingReading = db.prepare('SELECT id FROM meter_readings WHERE user_id = ? AND period_key = ?').get(user_id, period_key);
    let readingId;

    if (existingReading) {
      db.prepare(`
        UPDATE meter_readings SET
          read_date = ?,
          previous_reading = ?,
          current_reading = ?,
          units_used = ?,
          reader_name = ?,
          photo_url = COALESCE(?, photo_url),
          anomaly_flag = ?,
          notes = ?
        WHERE id = ?
      `).run(
        read_date || new Date().toISOString().split('T')[0],
        prev,
        curr,
        units,
        reader_name || 'นายสมหมาย พิทักษ์น้ำ',
        photo_url || null,
        anomaly_flag,
        notes || '',
        existingReading.id
      );
      readingId = existingReading.id;
    } else {
      const insert = db.prepare(`
        INSERT INTO meter_readings (
          user_id, period_month, period_year, period_key, read_date,
          previous_reading, current_reading, units_used, reader_name,
          photo_url, anomaly_flag, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        user_id,
        month,
        thaiYear,
        period_key,
        read_date || new Date().toISOString().split('T')[0],
        prev,
        curr,
        units,
        reader_name || 'นายสมหมาย พิทักษ์น้ำ',
        photo_url || null,
        anomaly_flag,
        notes || ''
      );
      readingId = insert.lastInsertRowid;
    }

    // Auto calculate and update/create bill
    const user = db.prepare('SELECT * FROM water_users WHERE id = ?').get(user_id);
    const settings = getSettings();
    const calc = calculateWaterCharge(units, user.category, settings);

    const existingBill = db.prepare('SELECT id, payment_status, bill_no FROM bills WHERE user_id = ? AND period_key = ?').get(user_id, period_key);

    const dueDays = parseInt(settings.due_days) || 15;
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + dueDays);
    const dueDateStr = dueDateObj.toISOString().split('T')[0];

    if (existingBill) {
      db.prepare(`
        UPDATE bills SET
          reading_id = ?,
          units_used = ?,
          water_charge = ?,
          service_fee = ?,
          vat_amount = ?,
          total_amount = ?,
          notes = ?
        WHERE id = ?
      `).run(
        readingId,
        units,
        calc.waterCharge,
        calc.serviceFee,
        calc.vatAmount,
        calc.totalAmount,
        notes || '',
        existingBill.id
      );
    } else {
      // Generate new bill number
      const billCount = db.prepare('SELECT COUNT(*) as count FROM bills WHERE period_key = ?').get(period_key).count + 1;
      const billNo = `INV-${thaiYear}${String(month).padStart(2, '0')}-${String(billCount).padStart(4, '0')}`;

      db.prepare(`
        INSERT INTO bills (
          reading_id, user_id, bill_no, period_key, units_used,
          water_charge, service_fee, vat_amount, total_amount,
          due_date, payment_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', ?)
      `).run(
        readingId,
        user_id,
        billNo,
        period_key,
        units,
        calc.waterCharge,
        calc.serviceFee,
        calc.vatAmount,
        calc.totalAmount,
        dueDateStr,
        notes || ''
      );
    }

    logActivity('METER_READ', `บันทึกมิเตอร์ ${user.user_code} (${user.name}) รอบ ${period_key}: ${units} หน่วย`, user.user_code);

    res.json({
      success: true,
      message: 'บันทึกการอ่านมิเตอร์และคำนวณค่าน้ำเรียบร้อยแล้ว',
      data: {
        units_used: units,
        water_charge: calc.waterCharge,
        total_amount: calc.totalAmount,
        anomaly_flag
      }
    });
  } catch (err) {
    console.error('Error saving reading:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Batch save meter readings
app.post('/api/readings/batch', (req, res) => {
  try {
    const { period_key, readings } = req.body;
    if (!period_key || !Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({ success: false, error: 'ข้อมูลไม่ถูกต้อง' });
    }

    const settings = getSettings();
    const [yearStr, monthStr] = period_key.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const thaiYear = year + 543;

    let savedCount = 0;
    const tx = db.transaction(() => {
      for (const item of readings) {
        if (item.current_reading === undefined || item.current_reading === null || item.current_reading === '') {
          continue;
        }

        const prev = parseFloat(item.previous_reading) || 0;
        const curr = parseFloat(item.current_reading) || 0;
        if (curr < prev) continue;

        const units = Math.round((curr - prev) * 100) / 100;
        let anomaly = 'normal';
        if (units === 0) anomaly = 'zero_usage';
        else if (units > 60) anomaly = 'high_usage';

        const existingReading = db.prepare('SELECT id FROM meter_readings WHERE user_id = ? AND period_key = ?').get(item.user_id, period_key);
        let readingId;

        if (existingReading) {
          db.prepare(`
            UPDATE meter_readings SET
              read_date = ?,
              previous_reading = ?,
              current_reading = ?,
              units_used = ?,
              reader_name = ?,
              anomaly_flag = ?,
              notes = ?
            WHERE id = ?
          `).run(
            item.read_date || new Date().toISOString().split('T')[0],
            prev,
            curr,
            units,
            item.reader_name || 'นายสมหมาย พิทักษ์น้ำ',
            anomaly,
            item.notes || '',
            existingReading.id
          );
          readingId = existingReading.id;
        } else {
          const insert = db.prepare(`
            INSERT INTO meter_readings (
              user_id, period_month, period_year, period_key, read_date,
              previous_reading, current_reading, units_used, reader_name,
              anomaly_flag, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            item.user_id,
            month,
            thaiYear,
            period_key,
            item.read_date || new Date().toISOString().split('T')[0],
            prev,
            curr,
            units,
            item.reader_name || 'นายสมหมาย พิทักษ์น้ำ',
            anomaly,
            item.notes || ''
          );
          readingId = insert.lastInsertRowid;
        }

        // Bill upsert
        const user = db.prepare('SELECT category FROM water_users WHERE id = ?').get(item.user_id);
        const calc = calculateWaterCharge(units, user ? user.category : 'residential', settings);
        const existingBill = db.prepare('SELECT id FROM bills WHERE user_id = ? AND period_key = ?').get(item.user_id, period_key);

        if (existingBill) {
          db.prepare(`
            UPDATE bills SET
              reading_id = ?,
              units_used = ?,
              water_charge = ?,
              service_fee = ?,
              vat_amount = ?,
              total_amount = ?
            WHERE id = ?
          `).run(readingId, units, calc.waterCharge, calc.serviceFee, calc.vatAmount, calc.totalAmount, existingBill.id);
        } else {
          const billCount = db.prepare('SELECT COUNT(*) as count FROM bills WHERE period_key = ?').get(period_key).count + 1;
          const billNo = `INV-${thaiYear}${String(month).padStart(2, '0')}-${String(billCount).padStart(4, '0')}`;
          const dueDays = parseInt(settings.due_days) || 15;
          const dueDateObj = new Date();
          dueDateObj.setDate(dueDateObj.getDate() + dueDays);

          db.prepare(`
            INSERT INTO bills (
              reading_id, user_id, bill_no, period_key, units_used,
              water_charge, service_fee, vat_amount, total_amount,
              due_date, payment_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid')
          `).run(readingId, item.user_id, billNo, period_key, units, calc.waterCharge, calc.serviceFee, calc.vatAmount, calc.totalAmount, dueDateObj.toISOString().split('T')[0]);
        }

        savedCount++;
      }
    });

    tx();
    logActivity('METER_BATCH', `บันทึกมิเตอร์แบบชุดสำเร็จ ${savedCount} รายการ ในรอบ ${period_key}`);

    res.json({
      success: true,
      message: `บันทึกข้อมูลมิเตอร์สำเร็จ ${savedCount} รายการ`,
      count: savedCount
    });
  } catch (err) {
    console.error('Error saving batch readings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 4. BILLS & INVOICING API
// ----------------------------------------------------
app.get('/api/bills', (req, res) => {
  try {
    const { period, status, zone, search } = req.query;
    let query = `
      SELECT 
        b.*,
        u.user_code,
        u.name as user_name,
        u.phone as user_phone,
        u.house_no,
        u.village_no,
        u.zone,
        u.meter_number,
        u.category as user_category,
        r.read_date,
        r.previous_reading,
        r.current_reading
      FROM bills b
      JOIN water_users u ON b.user_id = u.id
      LEFT JOIN meter_readings r ON b.reading_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (period && period !== 'all') {
      query += ' AND b.period_key = ?';
      params.push(period);
    }

    if (status && status !== 'all') {
      query += ' AND b.payment_status = ?';
      params.push(status);
    }

    if (zone && zone !== 'all') {
      query += ' AND u.zone = ?';
      params.push(zone);
    }

    if (search) {
      query += ` AND (
        b.bill_no LIKE ? OR
        u.user_code LIKE ? OR
        u.name LIKE ? OR
        u.house_no LIKE ? OR
        u.meter_number LIKE ?
      )`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    query += ' ORDER BY b.id DESC';
    const bills = db.prepare(query).all(...params);

    res.json({ success: true, data: bills });
  } catch (err) {
    console.error('Error fetching bills:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Single bill details with PromptPay QR Code
app.get('/api/bills/:id', async (req, res) => {
  try {
    const bill = db.prepare(`
      SELECT 
        b.*,
        u.user_code,
        u.name as user_name,
        u.phone as user_phone,
        u.house_no,
        u.village_no,
        u.subdistrict,
        u.district,
        u.province,
        u.zone,
        u.meter_number,
        u.meter_size,
        u.category as user_category,
        r.read_date,
        r.previous_reading,
        r.current_reading,
        r.reader_name
      FROM bills b
      JOIN water_users u ON b.user_id = u.id
      LEFT JOIN meter_readings r ON b.reading_id = r.id
      WHERE b.id = ?
    `).get(req.params.id);

    if (!bill) {
      return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลใบแจ้งหนี้' });
    }

    const settings = getSettings();
    let qrCodeDataURL = null;
    let qrPayload = null;

    if (settings.promptpay_id) {
      qrPayload = generatePromptPayPayload(settings.promptpay_id, bill.total_amount);
      qrCodeDataURL = await generateQRCodeDataURL(settings.promptpay_id, bill.total_amount);
    }

    res.json({
      success: true,
      data: {
        ...bill,
        settings,
        qrCodeDataURL,
        qrPayload
      }
    });
  } catch (err) {
    console.error('Error fetching bill details:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark bill as paid
app.post('/api/bills/:id/pay', (req, res) => {
  try {
    const { payment_method, cashier_name, paid_amount, notes } = req.body;
    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(req.params.id);
    if (!bill) return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลบิล' });

    const user = db.prepare('SELECT user_code, name FROM water_users WHERE id = ?').get(bill.user_id);

    // Generate receipt number REC-YYYYMM-XXXX
    const [yearStr, monthStr] = bill.period_key.split('-');
    const thaiYear = parseInt(yearStr, 10) + 543;
    const receiptCount = db.prepare('SELECT COUNT(*) as count FROM bills WHERE receipt_no IS NOT NULL').get().count + 1;
    const receipt_no = `REC-${thaiYear}${monthStr}-${String(receiptCount).padStart(4, '0')}`;
    const paid_date = new Date().toISOString().replace('T', ' ').substring(0, 19);

    db.prepare(`
      UPDATE bills SET
        payment_status = 'paid',
        paid_date = ?,
        paid_amount = ?,
        payment_method = ?,
        receipt_no = ?,
        cashier_name = ?,
        notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(
      paid_date,
      paid_amount || bill.total_amount,
      payment_method || 'promptpay',
      receipt_no,
      cashier_name || 'เจ้าหน้าที่การเงิน',
      notes || null,
      req.params.id
    );

    logActivity('PAYMENT_RECEIVE', `รับชำระค่าน้ำ บิล ${bill.bill_no} ยอด ${bill.total_amount} บ. (${user.name})`, user.user_code);

    res.json({
      success: true,
      message: 'บันทึกการชำระเงินเรียบร้อยแล้ว',
      data: {
        receipt_no,
        paid_date,
        paid_amount: paid_amount || bill.total_amount,
        payment_status: 'paid'
      }
    });
  } catch (err) {
    console.error('Error recording payment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Revert payment status to unpaid
app.post('/api/bills/:id/unpay', (req, res) => {
  try {
    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(req.params.id);
    if (!bill) return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลบิล' });

    db.prepare(`
      UPDATE bills SET
        payment_status = 'unpaid',
        paid_date = NULL,
        paid_amount = NULL,
        payment_method = NULL,
        receipt_no = NULL,
        cashier_name = NULL
      WHERE id = ?
    `).run(req.params.id);

    logActivity('PAYMENT_CANCEL', `ยกเลิกการชำระเงิน บิล ${bill.bill_no}`);

    res.json({ success: true, message: 'ยกเลิกสถานะการชำระเงินเรียบร้อยแล้ว' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Bulk Print Bills Data (fetches multiple bills with PromptPay QR)
app.get('/api/bills/bulk/print', async (req, res) => {
  try {
    const { period, zone } = req.query;
    let query = `
      SELECT 
        b.*,
        u.user_code,
        u.name as user_name,
        u.phone as user_phone,
        u.house_no,
        u.village_no,
        u.subdistrict,
        u.district,
        u.province,
        u.zone,
        u.meter_number,
        u.meter_size,
        u.category as user_category,
        r.read_date,
        r.previous_reading,
        r.current_reading
      FROM bills b
      JOIN water_users u ON b.user_id = u.id
      LEFT JOIN meter_readings r ON b.reading_id = r.id
      WHERE b.period_key = ?
    `;
    const params = [period || getCurrentPeriod().key];

    if (zone && zone !== 'all') {
      query += ' AND u.zone = ?';
      params.push(zone);
    }

    query += ' ORDER BY u.zone ASC, u.user_code ASC';
    const bills = db.prepare(query).all(...params);
    const settings = getSettings();

    // Generate QR codes for each bill
    const billsWithQR = await Promise.all(
      bills.map(async (bill) => {
        let qrCodeDataURL = null;
        if (settings.promptpay_id) {
          qrCodeDataURL = await generateQRCodeDataURL(settings.promptpay_id, bill.total_amount);
        }
        return {
          ...bill,
          qrCodeDataURL
        };
      })
    );

    res.json({
      success: true,
      data: {
        settings,
        bills: billsWithQR
      }
    });
  } catch (err) {
    console.error('Error fetching bulk print bills:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 5. REPORTS API
// ----------------------------------------------------
app.get('/api/reports/monthly', (req, res) => {
  try {
    const period = req.query.period || getCurrentPeriod().key;

    const summary = db.prepare(`
      SELECT 
        COUNT(b.id) as total_bills,
        COALESCE(SUM(b.units_used), 0) as total_units,
        COALESCE(SUM(b.water_charge), 0) as total_water_charge,
        COALESCE(SUM(b.service_fee), 0) as total_service_fee,
        COALESCE(SUM(b.vat_amount), 0) as total_vat,
        COALESCE(SUM(b.total_amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.paid_amount ELSE 0 END), 0) as total_collected,
        COALESCE(SUM(CASE WHEN b.payment_status != 'paid' THEN b.total_amount ELSE 0 END), 0) as total_unpaid,
        COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN 1 ELSE 0 END), 0) as paid_count,
        COALESCE(SUM(CASE WHEN b.payment_status != 'paid' THEN 1 ELSE 0 END), 0) as unpaid_count
      FROM bills b
      WHERE b.period_key = ?
    `).get(period);

    // Zone breakdown
    const byZone = db.prepare(`
      SELECT 
        u.zone,
        COUNT(b.id) as bills_count,
        COALESCE(SUM(b.units_used), 0) as units_used,
        COALESCE(SUM(b.total_amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.paid_amount ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN b.payment_status != 'paid' THEN b.total_amount ELSE 0 END), 0) as unpaid_amount
      FROM bills b
      JOIN water_users u ON b.user_id = u.id
      WHERE b.period_key = ?
      GROUP BY u.zone
      ORDER BY u.zone ASC
    `).all(period);

    // Category breakdown
    const byCategory = db.prepare(`
      SELECT 
        u.category,
        COUNT(b.id) as bills_count,
        COALESCE(SUM(b.units_used), 0) as units_used,
        COALESCE(SUM(b.total_amount), 0) as total_amount
      FROM bills b
      JOIN water_users u ON b.user_id = u.id
      WHERE b.period_key = ?
      GROUP BY u.category
    `).all(period);

    res.json({
      success: true,
      data: {
        period,
        summary,
        byZone,
        byCategory
      }
    });
  } catch (err) {
    console.error('Error fetching monthly report:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Overdue report / ลูกหนี้ค้างชำระ
app.get('/api/reports/overdue', (req, res) => {
  try {
    const overdueBills = db.prepare(`
      SELECT 
        b.*,
        u.user_code,
        u.name as user_name,
        u.phone as user_phone,
        u.house_no,
        u.village_no,
        u.zone,
        u.meter_number
      FROM bills b
      JOIN water_users u ON b.user_id = u.id
      WHERE b.payment_status = 'overdue' OR (b.payment_status = 'unpaid' AND b.due_date < CURRENT_DATE)
      ORDER BY b.due_date ASC
    `).all();

    // Group overdue by user
    const usersWithDebt = {};
    for (const bill of overdueBills) {
      if (!usersWithDebt[bill.user_id]) {
        usersWithDebt[bill.user_id] = {
          user_id: bill.user_id,
          user_code: bill.user_code,
          name: bill.user_name,
          phone: bill.user_phone,
          house_no: bill.house_no,
          village_no: bill.village_no,
          zone: bill.zone,
          meter_number: bill.meter_number,
          total_overdue_amount: 0,
          overdue_bills_count: 0,
          bills: []
        };
      }
      usersWithDebt[bill.user_id].total_overdue_amount += bill.total_amount;
      usersWithDebt[bill.user_id].overdue_bills_count++;
      usersWithDebt[bill.user_id].bills.push(bill);
    }

    res.json({
      success: true,
      data: {
        debtors: Object.values(usersWithDebt),
        totalDebtors: Object.keys(usersWithDebt).length,
        totalDebtAmount: overdueBills.reduce((sum, b) => sum + b.total_amount, 0),
        bills: overdueBills
      }
    });
  } catch (err) {
    console.error('Error fetching overdue report:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 6. SETTINGS & SYSTEM UTILS API
// ----------------------------------------------------
app.get('/api/settings', (req, res) => {
  try {
    const settings = getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    const updated = updateSettings(req.body);
    res.json({ success: true, message: 'บันทึกการตั้งค่าสำเร็จ', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings/reset-demo', (req, res) => {
  try {
    seedData(true);
    res.json({ success: true, message: 'รีเซ็ตและสร้างข้อมูลตัวอย่างเสร็จสมบูรณ์' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PromptPay QR preview API
app.get('/api/promptpay-qr', async (req, res) => {
  try {
    const { target, amount } = req.query;
    const settings = getSettings();
    const ppTarget = target || settings.promptpay_id || '0899876543';
    const ppAmount = parseFloat(amount) || 0;

    const payload = generatePromptPayPayload(ppTarget, ppAmount);
    const dataURL = await generateQRCodeDataURL(ppTarget, ppAmount);

    res.json({
      success: true,
      target: ppTarget,
      amount: ppAmount,
      payload,
      dataURL
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Backup Database
app.get('/api/backup', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM water_users').all();
    const readings = db.prepare('SELECT * FROM meter_readings').all();
    const bills = db.prepare('SELECT * FROM bills').all();
    const settings = getSettings();
    const logs = db.prepare('SELECT * FROM activity_logs').all();

    const backupData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      settings,
      users,
      readings,
      bills,
      logs
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=waterworks-backup-${new Date().toISOString().split('T')[0]}.json`);
    res.send(JSON.stringify(backupData, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CSV Export for Users
app.get('/api/export/users.csv', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM water_users ORDER BY user_code ASC').all();
    let csv = '\uFEFF'; // UTF-8 BOM for Excel Thai language support
    csv += 'รหัสผู้ใช้น้ำ,ชื่อ-นามสกุล,เลขบัตรประชาชน,เบอร์โทร,บ้านเลขที่,หมู่ที่,ตำบล,อำเภอ,จังหวัด,สายการจด,เลขมิเตอร์,ขนาดมิเตอร์,ประเภท,สถานะ,เลขมิเตอร์ตั้งต้น,วันที่ติดตั้ง\n';

    for (const u of users) {
      csv += `"${u.user_code}","${u.name}","${u.id_card || ''}","${u.phone || ''}","${u.house_no}","${u.village_no || ''}","${u.subdistrict || ''}","${u.district || ''}","${u.province || ''}","${u.zone}","${u.meter_number}","${u.meter_size}","${u.category}","${u.status}","${u.initial_reading}","${u.install_date || ''}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=water-users-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend static build if it exists
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server with automatic port fallback and error resilience
function startServer(port, retries = 5) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Smart WaterWorks server running at http://0.0.0.0:${port}`);
    console.log(`   เปิดใช้งานได้ที่: http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && retries > 0) {
      console.log(`ℹ️ พอร์ต ${port} กำลังถูกใช้งานอยู่ กำลังเปิดใช้งานบนพอร์ต ${Number(port) + 1}...`);
      startServer(Number(port) + 1, retries - 1);
    } else {
      console.error('❌ Server startup error:', err.message);
    }
  });

  return server;
}

if (require.main === module) {
  startServer(PORT);
}

module.exports = { app, startServer };

