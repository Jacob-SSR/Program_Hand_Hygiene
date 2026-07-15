-- =============================================================
-- ระบบบันทึกการสังเกตการทำความสะอาดมือ (Hand Hygiene)
-- ฐานข้อมูลแยกต่างหากจาก HOSxP ชื่อ hygiene (utf8mb4)
-- =============================================================
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS hygiene
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hygiene;

-- ---------- 1) ผู้ใช้ระบบ (login ด้วยเลข ปชช. 13 หลัก + รหัส 4 หลัก) ----------
CREATE TABLE IF NOT EXISTS hygiene_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cid CHAR(13) NOT NULL UNIQUE,
  pin_hash CHAR(64) NOT NULL COMMENT 'SHA-256 ของรหัส 4 หลัก',
  full_name VARCHAR(150) NOT NULL,
  role ENUM('admin','user') NOT NULL DEFAULT 'user',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- 2) หน่วยเบิก / หน่วยงาน ----------
CREATE TABLE IF NOT EXISTS hygiene_units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ---------- 3) บุคลากร (สำหรับประเมินรายบุคคล) ----------
CREATE TABLE IF NOT EXISTS hygiene_personnel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cid CHAR(13) NULL,
  full_name VARCHAR(150) NOT NULL,
  position VARCHAR(100) NULL,
  unit_id INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (unit_id) REFERENCES hygiene_units(id),
  INDEX idx_personnel_name (full_name)
) ENGINE=InnoDB;

-- ---------- 4) ข้อมูลการสังเกต (ตารางหลัก) ----------
CREATE TABLE IF NOT EXISTS hygiene_observations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fiscal_year SMALLINT NOT NULL COMMENT 'ปีงบประมาณ พ.ศ. เช่น 2569',
  quarter TINYINT NOT NULL COMMENT '1=ต.ค.-ธ.ค. 2=ม.ค.-มี.ค. 3=เม.ย.-มิ.ย. 4=ก.ค.-ก.ย.',
  obs_no INT NOT NULL COMMENT 'ครั้งที่สังเกต รันต่อในปีงบ+ไตรมาส+หน่วยเดียวกัน',
  obs_date DATE NOT NULL,
  unit_id INT NOT NULL,
  staff_type VARCHAR(50) NOT NULL,
  personnel_id INT NULL COMMENT 'NULL = ไม่ระบุรายบุคคล',
  moment TINYINT NOT NULL COMMENT '1-5 ตาม WHO 5 Moments',
  performed TINYINT NOT NULL COMMENT '1=ปฏิบัติ 0=ไม่ปฏิบัติ',
  agent VARCHAR(50) NULL COMMENT 'น้ำยาที่ใช้ (เมื่อปฏิบัติ)',
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES hygiene_units(id),
  FOREIGN KEY (personnel_id) REFERENCES hygiene_personnel(id),
  FOREIGN KEY (created_by) REFERENCES hygiene_users(id),
  INDEX idx_obs_fy_q (fiscal_year, quarter),
  INDEX idx_obs_date (obs_date),
  INDEX idx_obs_unit (unit_id)
) ENGINE=InnoDB;

-- =============================================================
-- Seed: หน่วยเบิกของ รพ. (แก้ชื่อ/เพิ่มลดตามจริงได้เลย)
-- =============================================================
INSERT IGNORE INTO hygiene_units (code, name) VALUES
 ('IPD', 'ตึกผู้ป่วยใน'),
 ('ER',  'ห้องอุบัติเหตุ-ฉุกเฉิน'),
 ('OPD', 'ผู้ป่วยนอก'),
 ('LR',  'ห้องคลอด'),
 ('DENT','ทันตกรรม'),
 ('LAB', 'ชันสูตร'),
 ('XRAY','รังสีวิทยา'),
 ('PT',  'กายภาพบำบัด'),
 ('PCU', 'PCU / เวชปฏิบัติครอบครัว');

-- ผู้ใช้ทดสอบ: login 1234567890123 / 0000 (ลบทิ้งก่อนใช้จริง)
INSERT IGNORE INTO hygiene_users (cid, pin_hash, full_name, role)
VALUES ('1234567890123', SHA2('0000', 256), 'ผู้ดูแลระบบ (ทดสอบ)', 'admin');

-- บุคลากรตัวอย่าง 1 คน (ไว้ทดสอบค้นหารายบุคคล)
INSERT IGNORE INTO hygiene_personnel (full_name, position, unit_id)
SELECT 'ตัวอย่าง บุคลากร', 'พยาบาลวิชาชีพ', id FROM hygiene_units WHERE code = 'IPD';