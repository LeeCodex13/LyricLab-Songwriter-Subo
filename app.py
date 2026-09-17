#!/usr/bin/env python3
"""
Smart WaterWorks - Python Runner
Allows starting the Smart WaterWorks system directly using `python app.py` or `python main.py`
"""
import subprocess
import sys
import os

def main():
    print("=" * 60)
    print("  Smart WaterWorks - ระบบบริหารจัดการข้อมูลผู้ใช้น้ำประปา")
    print("=" * 60)
    print("🚀 กำลังเริ่มต้นเซิร์ฟเวอร์...")
    
    dir_path = os.path.dirname(os.path.abspath(__file__))
    os.chdir(dir_path)

    # Check node is available
    try:
        subprocess.run(["node", "-v"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    except Exception:
        print("❌ ไม่พบ Node.js ในระบบ กรุณาติดตั้ง Node.js ก่อนใช้งาน")
        sys.exit(1)

    try:
        subprocess.run(["node", "server/index.js"])
    except KeyboardInterrupt:
        print("\n👋 ปิดระบบเรียบร้อยแล้ว")
        sys.exit(0)

if __name__ == "__main__":
    main()
