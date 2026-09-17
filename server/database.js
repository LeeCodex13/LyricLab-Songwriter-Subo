const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'waterworks.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS water_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      id_card TEXT,
      phone TEXT,
      house_no TEXT NOT NULL,
      village_no TEXT DEFAULT 'หมู่ 1',
      subdistrict TEXT DEFAULT 'ตำบลเมืองใหม่',
      district TEXT DEFAULT 'อำเภอเมือง',
      province TEXT DEFAULT 'เชียงใหม่',
      zone TEXT DEFAULT 'สายที่ 1 (โซนเหนือ)',
      meter_number TEXT UNIQUE NOT NULL,
      meter_size TEXT DEFAULT '1/2 นิ้ว (4 หุน)',
      category TEXT DEFAULT 'residential', -- residential, commercial, government, agriculture
      status TEXT DEFAULT 'active', -- active, suspended, terminated
      initial_reading REAL DEFAULT 0,
      install_date TEXT,
      notes TEXT,
      latitude REAL,
      longitude REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meter_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      period_month INTEGER NOT NULL,
      period_year INTEGER NOT NULL,
      period_key TEXT NOT NULL, -- e.g. '2026-09'
      read_date TEXT NOT NULL,
      previous_reading REAL NOT NULL,
      current_reading REAL NOT NULL,
      units_used REAL NOT NULL,
      reader_name TEXT DEFAULT 'นายสมหมาย พิทักษ์น้ำ',
      photo_url TEXT,
      anomaly_flag TEXT DEFAULT 'normal', -- normal, high_usage, low_usage, zero_usage, broken_meter
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES water_users(id) ON DELETE CASCADE,
      UNIQUE(user_id, period_key)
    );

    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reading_id INTEGER,
      user_id INTEGER NOT NULL,
      bill_no TEXT UNIQUE NOT NULL,
      period_key TEXT NOT NULL,
      units_used REAL NOT NULL,
      water_charge REAL NOT NULL,
      service_fee REAL NOT NULL DEFAULT 20.0,
      vat_amount REAL NOT NULL DEFAULT 0.0,
      total_amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      payment_status TEXT DEFAULT 'unpaid', -- unpaid, paid, overdue
      paid_date TEXT,
      paid_amount REAL,
      payment_method TEXT, -- cash, promptpay, bank_transfer
      receipt_no TEXT,
      cashier_name TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reading_id) REFERENCES meter_readings(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES water_users(id) ON DELETE CASCADE,
      UNIQUE(user_id, period_key)
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT NOT NULL,
      description TEXT NOT NULL,
      user_code TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Initialize default settings if not exists
  const existingSettings = db.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (existingSettings.count === 0) {
    const defaultSettings = [
      ['org_name', 'กองการประปา เทศบาลตำบลน้ำใสเจริญ'],
      ['org_subtitle', 'ระบบบริหารจัดการน้ำประปาชุมชนและท้องถิ่น'],
      ['org_address', '99 หมู่ 2 ถนนประปาสามัคคี ต.น้ำใส อ.เมือง จ.เชียงใหม่ 50000'],
      ['org_phone', '053-123456, 089-9876543'],
      ['org_tax_id', '0994000123456'],
      ['promptpay_id', '0899876543'],
      ['promptpay_name', 'เทศบาลตำบลน้ำใสเจริญ (กองการประปา)'],
      ['service_fee', '20'],
      ['vat_enabled', 'false'],
      ['vat_rate', '7'],
      ['due_days', '15'],
      ['tariff_tiers', JSON.stringify({
        residential: [
          { min: 0, max: 10, rate: 8 },
          { min: 11, max: 20, rate: 10 },
          { min: 21, max: 30, rate: 12 },
          { min: 31, max: null, rate: 15 }
        ],
        commercial: [
          { min: 0, max: 20, rate: 12 },
          { min: 21, max: 50, rate: 15 },
          { min: 51, max: null, rate: 18 }
        ],
        government: [
          { min: 0, max: null, rate: 9 }
        ],
        agriculture: [
          { min: 0, max: null, rate: 7 }
        ]
      })]
    ];

    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of defaultSettings) {
      insertSetting.run(k, v);
    }
  }
}

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of rows) {
    if (row.key === 'tariff_tiers') {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch (e) {
        settings[row.key] = {};
      }
    } else if (row.key === 'service_fee' || row.key === 'vat_rate' || row.key === 'due_days') {
      settings[row.key] = parseFloat(row.value) || 0;
    } else if (row.key === 'vat_enabled') {
      settings[row.key] = row.value === 'true';
    } else {
      settings[row.key] = row.value;
    }
  }
  return settings;
}

function updateSettings(newSettings) {
  const updateStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, val] of Object.entries(newSettings)) {
    const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
    updateStmt.run(key, strVal);
  }
  logActivity('SETTINGS_UPDATE', 'อัปเดตการตั้งค่าระบบและอัตราค่าน้ำ');
  return getSettings();
}

function calculateWaterCharge(units, category = 'residential', settings = null) {
  if (!settings) settings = getSettings();
  const tiersConfig = settings.tariff_tiers || {};
  const tiers = tiersConfig[category] || tiersConfig['residential'] || [
    { min: 0, max: 10, rate: 8 },
    { min: 11, max: 20, rate: 10 },
    { min: 21, max: 30, rate: 12 },
    { min: 31, max: null, rate: 15 }
  ];

  let remaining = Math.max(0, Number(units) || 0);
  let totalWaterCharge = 0;

  for (const tier of tiers) {
    if (remaining <= 0) break;
    const tierCapacity = tier.max ? (tier.max - tier.min + (tier.min === 0 ? 0 : 1)) : Infinity;
    const unitsInThisTier = Math.min(remaining, tierCapacity);
    totalWaterCharge += unitsInThisTier * tier.rate;
    remaining -= unitsInThisTier;
  }

  const serviceFee = parseFloat(settings.service_fee) || 20;
  const subtotal = totalWaterCharge + serviceFee;
  let vatAmount = 0;
  if (settings.vat_enabled) {
    vatAmount = Math.round(subtotal * (parseFloat(settings.vat_rate || 7) / 100) * 100) / 100;
  }
  const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;

  return {
    units: Number(units) || 0,
    waterCharge: Math.round(totalWaterCharge * 100) / 100,
    serviceFee,
    vatAmount,
    totalAmount
  };
}

function logActivity(action_type, description, user_code = null) {
  try {
    db.prepare('INSERT INTO activity_logs (action_type, description, user_code) VALUES (?, ?, ?)').run(
      action_type, description, user_code
    );
  } catch (e) {
    console.error('Error logging activity:', e);
  }
}

module.exports = {
  db,
  initDb,
  getSettings,
  updateSettings,
  calculateWaterCharge,
  logActivity
};
