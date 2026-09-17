#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  Smart WaterWorks - ระบบบริหารจัดการข้อมูลผู้ใช้น้ำประปา"
echo "=========================================================="

# Check if dist exists, if not build it
if [ ! -d "dist" ]; then
  echo "📦 กำลังคอมไพล์ Frontend (vite build)..."
  npm run build
fi

echo "🚀 กำลังเริ่มต้นเซิร์ฟเวอร์บนพอร์ต 3000..."
npm start
