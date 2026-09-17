const { db, initDb, getSettings, calculateWaterCharge, logActivity } = require('./database');

function seedData(force = false) {
  initDb();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM water_users').get().count;
  if (userCount > 0 && !force) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  if (force) {
    db.exec(`
      DELETE FROM activity_logs;
      DELETE FROM bills;
      DELETE FROM meter_readings;
      DELETE FROM water_users;
    `);
    console.log('Cleared existing data for reseeding.');
  }

  const sampleUsers = [
    {
      user_code: 'W-1001',
      name: 'นายประสิทธิ์ วงศ์สุวรรณ',
      id_card: '1509900123451',
      phone: '081-234-5678',
      house_no: '12/1',
      village_no: 'หมู่ 1',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 1 (โซนเหนือ)',
      meter_number: 'M-5001',
      meter_size: '1/2 นิ้ว (4 หุน)',
      category: 'residential',
      status: 'active',
      initial_reading: 120.0,
      install_date: '2024-01-15',
      notes: 'บ้านเดี่ยว 2 ชั้น อยู่ใกล้ปากซอย 1',
      latitude: 18.7883,
      longitude: 98.9853
    },
    {
      user_code: 'W-1002',
      name: 'นางสมศรี ใจดี',
      id_card: '1509900234562',
      phone: '089-876-5432',
      house_no: '15',
      village_no: 'หมู่ 1',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 1 (โซนเหนือ)',
      meter_number: 'M-5002',
      meter_size: '1/2 นิ้ว (4 หุน)',
      category: 'residential',
      status: 'active',
      initial_reading: 245.0,
      install_date: '2024-02-10',
      notes: 'บ้านไม้ยกพื้น มีถังเก็บน้ำสำรอง',
      latitude: 18.7891,
      longitude: 98.9861
    },
    {
      user_code: 'W-1003',
      name: 'นายบุญช่วย เกียรติขจร',
      id_card: '3509900345673',
      phone: '086-555-1234',
      house_no: '28/3',
      village_no: 'หมู่ 1',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 1 (โซนเหนือ)',
      meter_number: 'M-5003',
      meter_size: '1/2 นิ้ว (4 หุน)',
      category: 'residential',
      status: 'active',
      initial_reading: 310.0,
      install_date: '2024-03-05',
      notes: 'หลังคาเรือน 4 คน',
      latitude: 18.7902,
      longitude: 98.9875
    },
    {
      user_code: 'W-1004',
      name: 'ร้านกาแฟชบาแก้ว (นางสาวมณีรัตน์ แสงทอง)',
      id_card: '5509900456784',
      phone: '095-432-1098',
      house_no: '45',
      village_no: 'หมู่ 3',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 3 (โซนตลาด)',
      meter_number: 'M-5004',
      meter_size: '3/4 นิ้ว (6 หุน)',
      category: 'commercial',
      status: 'active',
      initial_reading: 520.0,
      install_date: '2024-04-12',
      notes: 'ร้านกาแฟสดและเบเกอรี่ เปิดทุกวัน',
      latitude: 18.7850,
      longitude: 98.9912
    },
    {
      user_code: 'W-1005',
      name: 'โรงเรียนบ้านดอนแก้ว (ผอ.วิชัย ภักดี)',
      id_card: '0994000889911',
      phone: '053-889977',
      house_no: '100',
      village_no: 'หมู่ 1',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 1 (โซนเหนือ)',
      meter_number: 'M-5005',
      meter_size: '1 นิ้ว',
      category: 'government',
      status: 'active',
      initial_reading: 1200.0,
      install_date: '2023-10-01',
      notes: 'โรงเรียนประถม มีนักเรียน 180 คน',
      latitude: 18.7925,
      longitude: 98.9880
    },
    {
      user_code: 'W-1006',
      name: 'นายกิตติศักดิ์ เจริญพร',
      id_card: '1509900567895',
      phone: '084-321-7890',
      house_no: '77/2',
      village_no: 'หมู่ 2',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 2 (โซนใต้)',
      meter_number: 'M-5006',
      meter_size: '1/2 นิ้ว (4 หุน)',
      category: 'residential',
      status: 'active',
      initial_reading: 88.0,
      install_date: '2024-05-20',
      notes: 'บ้านสร้างใหม่ มิเตอร์อยู่หน้าประตูรั้ว',
      latitude: 18.7812,
      longitude: 98.9840
    },
    {
      user_code: 'W-1007',
      name: 'ร้านซักรีดสะอาดจัง (นางพิมพา บุญเรือง)',
      id_card: '3509900678906',
      phone: '083-999-8877',
      house_no: '89',
      village_no: 'หมู่ 3',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 3 (โซนตลาด)',
      meter_number: 'M-5007',
      meter_size: '3/4 นิ้ว (6 หุน)',
      category: 'commercial',
      status: 'active',
      initial_reading: 430.0,
      install_date: '2024-02-28',
      notes: 'ใช้น้ำปริมาณมาก เครื่องซักผ้า 8 เครื่อง',
      latitude: 18.7858,
      longitude: 98.9925
    },
    {
      user_code: 'W-1008',
      name: 'วัดป่าชัยมงคล (เจ้าอาวาส)',
      id_card: '0994000778822',
      phone: '053-445566',
      house_no: '1',
      village_no: 'หมู่ 2',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 2 (โซนใต้)',
      meter_number: 'M-5008',
      meter_size: '1 นิ้ว',
      category: 'government',
      status: 'active',
      initial_reading: 850.0,
      install_date: '2023-08-15',
      notes: 'เขตอภัยทาน มีห้องน้ำสาธารณะสำหรับญาติโยม',
      latitude: 18.7795,
      longitude: 98.9832
    },
    {
      user_code: 'W-1009',
      name: 'สวนกล้วยไม้ลุงชิต (นายสมชิต พืชผล)',
      id_card: '1509900789017',
      phone: '087-111-2233',
      house_no: '144',
      village_no: 'หมู่ 4',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 4 (โซนสวนพัฒนา)',
      meter_number: 'M-5009',
      meter_size: '3/4 นิ้ว (6 หุน)',
      category: 'agriculture',
      status: 'active',
      initial_reading: 670.0,
      install_date: '2024-01-10',
      notes: 'ระบบสปริงเกลอร์รดน้ำกล้วยไม้',
      latitude: 18.7750,
      longitude: 98.9780
    },
    {
      user_code: 'W-1010',
      name: 'นายอนุชา พลอยงาม',
      id_card: '1509900890128',
      phone: '082-456-7891',
      house_no: '52',
      village_no: 'หมู่ 2',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 2 (โซนใต้)',
      meter_number: 'M-5010',
      meter_size: '1/2 นิ้ว (4 หุน)',
      category: 'residential',
      status: 'active',
      initial_reading: 190.0,
      install_date: '2024-03-22',
      notes: 'บ้านพักอาศัยครอบครัวเดี่ยว',
      latitude: 18.7820,
      longitude: 98.9855
    },
    {
      user_code: 'W-1011',
      name: 'นางนภา ฟ้ากระจ่าง',
      id_card: '3509900901239',
      phone: '085-667-8899',
      house_no: '63/1',
      village_no: 'หมู่ 2',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 2 (โซนใต้)',
      meter_number: 'M-5011',
      meter_size: '1/2 นิ้ว (4 หุน)',
      category: 'residential',
      status: 'active',
      initial_reading: 115.0,
      install_date: '2024-04-18',
      notes: 'บ้านตึกชั้นเดียว',
      latitude: 18.7825,
      longitude: 98.9860
    },
    {
      user_code: 'W-1012',
      name: 'ร้านอาหารตามสั่งป้าสมใจ (นางสมใจ พุ่มพวง)',
      id_card: '5509901012340',
      phone: '086-778-9900',
      house_no: '18',
      village_no: 'หมู่ 3',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 3 (โซนตลาด)',
      meter_number: 'M-5012',
      meter_size: '1/2 นิ้ว (4 หุน)',
      category: 'commercial',
      status: 'active',
      initial_reading: 340.0,
      install_date: '2024-02-01',
      notes: 'ร้านอาหารริมทาง เปิด 07.00 - 15.00',
      latitude: 18.7865,
      longitude: 98.9918
    },
    {
      user_code: 'W-1013',
      name: 'นายธนกฤต ศรีสวัสดิ์',
      id_card: '1509901123451',
      phone: '089-123-9988',
      house_no: '91',
      village_no: 'หมู่ 1',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 1 (โซนเหนือ)',
      meter_number: 'M-5013',
      meter_size: '1/2 นิ้ว (4 หุน)',
      category: 'residential',
      status: 'active',
      initial_reading: 210.0,
      install_date: '2024-03-10',
      notes: 'มีผู้พักอาศัย 3 คน',
      latitude: 18.7915,
      longitude: 98.9888
    },
    {
      user_code: 'W-1014',
      name: 'ฟาร์มเมล่อนอินทรีย์ (นายวีระ โชคอนันต์)',
      id_card: '1509901234562',
      phone: '081-998-8776',
      house_no: '205',
      village_no: 'หมู่ 4',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 4 (โซนสวนพัฒนา)',
      meter_number: 'M-5014',
      meter_size: '1 นิ้ว',
      category: 'agriculture',
      status: 'active',
      initial_reading: 780.0,
      install_date: '2024-01-25',
      notes: 'โรงเรือนปลูกเมล่อน 4 โรงเรือน ใช้น้ำหยด',
      latitude: 18.7742,
      longitude: 98.9765
    },
    {
      user_code: 'W-1015',
      name: 'นางสาวจารุณี รัตนโชติ',
      id_card: '3509901345673',
      phone: '090-554-3322',
      house_no: '33/5',
      village_no: 'หมู่ 2',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 2 (โซนใต้)',
      meter_number: 'M-5015',
      meter_size: '1/2 นิ้ว (4 หุน)',
      category: 'residential',
      status: 'active',
      initial_reading: 95.0,
      install_date: '2024-05-15',
      notes: 'เดินทางไปต่างจังหวัดบ่อย',
      latitude: 18.7830,
      longitude: 98.9870
    },
    {
      user_code: 'W-1016',
      name: 'นายชวลิต วาณิชย์',
      id_card: '1509901456784',
      phone: '083-222-1144',
      house_no: '108',
      village_no: 'หมู่ 1',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 1 (โซนเหนือ)',
      meter_number: 'M-5016',
      meter_size: '1/2 นิ้ว (4 หุน)',
      category: 'residential',
      status: 'suspended',
      initial_reading: 310.0,
      install_date: '2023-11-20',
      notes: 'ขอระงับการใช้น้ำชั่วคราว เจ้าของไปทำงานต่างประเทศ',
      latitude: 18.7930,
      longitude: 98.9892
    },
    {
      user_code: 'W-1017',
      name: 'มินิมาร์ทเจ๊เพ็ญ (นางวันเพ็ญ สุขสำราญ)',
      id_card: '5509901567895',
      phone: '087-889-9001',
      house_no: '50',
      village_no: 'หมู่ 3',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 3 (โซนตลาด)',
      meter_number: 'M-5017',
      meter_size: '3/4 นิ้ว (6 หุน)',
      category: 'commercial',
      status: 'active',
      initial_reading: 380.0,
      install_date: '2024-02-14',
      notes: 'ร้านขายของชำและเครื่องดื่ม',
      latitude: 18.7860,
      longitude: 98.9930
    },
    {
      user_code: 'W-1018',
      name: 'สถานีอนามัยเฉลิมพระเกียรติฯ ตำบลน้ำใส',
      id_card: '0994000665533',
      phone: '053-332211',
      house_no: '9',
      village_no: 'หมู่ 1',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 1 (โซนเหนือ)',
      meter_number: 'M-5018',
      meter_size: '3/4 นิ้ว (6 หุน)',
      category: 'government',
      status: 'active',
      initial_reading: 490.0,
      install_date: '2023-09-01',
      notes: 'รพ.สต. น้ำใส มีผู้ป่วยมารับบริการประจำ',
      latitude: 18.7905,
      longitude: 98.9868
    },
    {
      user_code: 'W-1019',
      name: 'นายประดิษฐ์ คำมี',
      id_card: '1509901678906',
      phone: '088-776-5544',
      house_no: '88/4',
      village_no: 'หมู่ 4',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 4 (โซนสวนพัฒนา)',
      meter_number: 'M-5019',
      meter_size: '1/2 นิ้ว (4 หุน)',
      category: 'residential',
      status: 'active',
      initial_reading: 160.0,
      install_date: '2024-04-05',
      notes: 'บ้านสวน ปลูกผักสวนครัว',
      latitude: 18.7765,
      longitude: 98.9790
    },
    {
      user_code: 'W-1020',
      name: 'นางปราณี มีสุข',
      id_card: '3509901789017',
      phone: '091-234-5670',
      house_no: '71',
      village_no: 'หมู่ 2',
      subdistrict: 'ตำบลน้ำใส',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      zone: 'สายที่ 2 (โซนใต้)',
      meter_number: 'M-5020',
      meter_size: '1/2 นิ้ว (4 หุน)',
      category: 'residential',
      status: 'active',
      initial_reading: 220.0,
      install_date: '2024-03-18',
      notes: 'มีผู้สูงอายุอยู่บ้านตลอดวัน',
      latitude: 18.7818,
      longitude: 98.9848
    }
  ];

  const insertUser = db.prepare(`
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

  const userIds = [];
  for (const u of sampleUsers) {
    const res = insertUser.run(u);
    userIds.push({ id: res.lastInsertRowid, ...u });
  }

  console.log(`Seeded ${userIds.length} water users.`);

  // Generate historical readings and bills for the past 6 months
  // Months: 2026-04, 2026-05, 2026-06, 2026-07, 2026-08, 2026-09
  const months = [
    { year: 2026, month: 4, thaiYear: 2569, thaiMonth: 'เมษายน', key: '2026-04' },
    { year: 2026, month: 5, thaiYear: 2569, thaiMonth: 'พฤษภาคม', key: '2026-05' },
    { year: 2026, month: 6, thaiYear: 2569, thaiMonth: 'มิถุนายน', key: '2026-06' },
    { year: 2026, month: 7, thaiYear: 2569, thaiMonth: 'กรกฎาคม', key: '2026-07' },
    { year: 2026, month: 8, thaiYear: 2569, thaiMonth: 'สิงหาคม', key: '2026-08' },
    { year: 2026, month: 9, thaiYear: 2569, thaiMonth: 'กันยายน', key: '2026-09' } // Current month
  ];

  const insertReading = db.prepare(`
    INSERT INTO meter_readings (
      user_id, period_month, period_year, period_key, read_date,
      previous_reading, current_reading, units_used, reader_name,
      anomaly_flag, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBill = db.prepare(`
    INSERT INTO bills (
      reading_id, user_id, bill_no, period_key, units_used,
      water_charge, service_fee, vat_amount, total_amount,
      due_date, payment_status, paid_date, paid_amount,
      payment_method, receipt_no, cashier_name, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const settings = getSettings();
  let billSeq = 1;

  // Track meter counters for each user
  const currentReadings = {};
  for (const u of userIds) {
    currentReadings[u.id] = u.initial_reading;
  }

  for (let mIdx = 0; mIdx < months.length; mIdx++) {
    const m = months[mIdx];
    const isCurrentMonth = (mIdx === months.length - 1); // 2026-09

    for (let uIdx = 0; uIdx < userIds.length; uIdx++) {
      const u = userIds[uIdx];

      // Skip reading for suspended users in later months
      if (u.status === 'suspended' && mIdx > 1) {
        continue;
      }

      // In current month (September 2026), leave 2 users unrecorded to allow demoing meter reading
      if (isCurrentMonth && (u.user_code === 'W-1013' || u.user_code === 'W-1020')) {
        continue;
      }

      // Base consumption based on category
      let baseUsage = 15;
      if (u.category === 'commercial') baseUsage = 38;
      else if (u.category === 'government') baseUsage = 55;
      else if (u.category === 'agriculture') baseUsage = 45;

      // Add natural monthly variance
      let variance = Math.sin((mIdx + uIdx) * 1.5) * 6;
      let units = Math.max(3, Math.round(baseUsage + variance));

      let anomaly = 'normal';
      let notes = '';

      // High usage anomaly test case for W-1002 in current month (leak simulation!)
      if (isCurrentMonth && u.user_code === 'W-1002') {
        units = 84;
        anomaly = 'high_usage';
        notes = 'ตรวจพบการใช้น้ำสูงผิดปกติ อาจมีท่อประปาภายในบ้านรั่วซึม แนะนำให้ตรวจสอบ';
      }

      // Zero usage anomaly test case for W-1015 in current month
      if (isCurrentMonth && u.user_code === 'W-1015') {
        units = 0;
        anomaly = 'zero_usage';
        notes = 'เจ้าของบ้านไม่อยู่ เลขมิเตอร์ไม่หมุน';
      }

      const prev = currentReadings[u.id];
      const curr = prev + units;
      currentReadings[u.id] = curr;

      const readDay = 15;
      const readDate = `${m.year}-${String(m.month).padStart(2, '0')}-${String(readDay).padStart(2, '0')}`;
      const dueDate = `${m.year}-${String(m.month).padStart(2, '0')}-28`;

      const readingRes = insertReading.run(
        u.id,
        m.month,
        m.thaiYear,
        m.key,
        readDate,
        prev,
        curr,
        units,
        'นายสมหมาย พิทักษ์น้ำ',
        anomaly,
        notes
      );

      const readingId = readingRes.lastInsertRowid;
      const calc = calculateWaterCharge(units, u.category, settings);

      const billNo = `INV-${m.thaiYear}${String(m.month).padStart(2, '0')}-${String(billSeq++).padStart(4, '0')}`;

      // Payment status determination:
      let paymentStatus = 'paid';
      let paidDate = null;
      let paidAmount = null;
      let paymentMethod = null;
      let receiptNo = null;
      let cashier = null;

      if (isCurrentMonth) {
        // Current month has mixed statuses: some paid, some unpaid
        if (uIdx % 3 === 0) {
          paymentStatus = 'paid';
          paidDate = `${m.year}-${String(m.month).padStart(2, '0')}-17 10:30:00`;
          paidAmount = calc.totalAmount;
          paymentMethod = uIdx % 2 === 0 ? 'promptpay' : 'cash';
          receiptNo = `REC-${m.thaiYear}${String(m.month).padStart(2, '0')}-${String(billSeq).padStart(4, '0')}`;
          cashier = 'นางสาวพิมพ์ใจ เจ้าหน้าที่การเงิน';
        } else {
          paymentStatus = 'unpaid';
        }
      } else if (mIdx === months.length - 2 && u.user_code === 'W-1006') {
        // One overdue bill from previous month (August 2026) for demoing overdue alert
        paymentStatus = 'overdue';
      } else {
        // Past months are paid
        paymentStatus = 'paid';
        paidDate = `${m.year}-${String(m.month).padStart(2, '0')}-22 14:15:00`;
        paidAmount = calc.totalAmount;
        paymentMethod = (uIdx % 2 === 0) ? 'promptpay' : 'cash';
        receiptNo = `REC-${m.thaiYear}${String(m.month).padStart(2, '0')}-${String(billSeq).padStart(4, '0')}`;
        cashier = 'นางสาวพิมพ์ใจ เจ้าหน้าที่การเงิน';
      }

      insertBill.run(
        readingId,
        u.id,
        billNo,
        m.key,
        units,
        calc.waterCharge,
        calc.serviceFee,
        calc.vatAmount,
        calc.totalAmount,
        dueDate,
        paymentStatus,
        paidDate,
        paidAmount,
        paymentMethod,
        receiptNo,
        cashier,
        notes
      );
    }
  }

  logActivity('SEED_DATA', 'สร้างข้อมูลตัวอย่างผู้ใช้น้ำ การจดมิเตอร์ และบิลค่าน้ำย้อนหลัง 6 เดือนสำเร็จ');
  console.log('Seeded 6 months of meter readings and bills successfully.');
}

module.exports = { seedData };

if (require.main === module) {
  seedData(true);
}
