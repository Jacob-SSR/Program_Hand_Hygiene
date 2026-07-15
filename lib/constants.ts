// ประเภทบุคลากรที่สังเกต
export const STAFF_TYPES = [
  "แพทย์",
  "พยาบาล",
  "ผู้ช่วยพยาบาล PN",
  "Aide",
  "คนงาน",
  "นักศึกษา",
  "Resident",
  "อื่นๆ",
] as const;

// WHO 5 Moments for Hand Hygiene
// label = ชื่อสั้นตามโปสเตอร์ / detail = ตัวอย่างหัตถการ โชว์ช่วยตอนเลือกในฟอร์ม
export const MOMENTS: { value: number; label: string; detail: string }[] = [
  {
    value: 1,
    label: "Moment ที่ 1 ก่อนสัมผัสผู้ป่วย",
    detail: "เช่น ก่อนจับตัวผู้ป่วย วัดสัญญาณชีพ พลิกตะแคงตัว",
  },
  {
    value: 2,
    label: "Moment ที่ 2 ก่อนทำหัตถการต่างๆ กับผู้ป่วย",
    detail: "เช่น ก่อนให้ IV, ทำแผล, ดูดเสมหะ, ใส่สายสวน, ฉีดยา",
  },
  {
    value: 3,
    label: "Moment ที่ 3 หลังสัมผัสเลือดและสารคัดหลั่งของผู้ป่วย",
    detail:
      "เช่น หลังดูดเสมหะ, เจาะเลือด, ทำแผล, เทปัสสาวะ, เก็บ bedpan, เก็บ Lab",
  },
  {
    value: 4,
    label: "Moment ที่ 4 หลังสัมผัสผู้ป่วย",
    detail: "เช่น หลังตรวจร่างกาย จับตัวผู้ป่วยเสร็จ",
  },
  {
    value: 5,
    label: "Moment ที่ 5 หลังสัมผัสสิ่งแวดล้อมของผู้ป่วย",
    detail: "เช่น หลังจับเตียง ราวเตียง เสาน้ำเกลือ โต๊ะข้างเตียง monitor",
  },
];

// ประเภทผลิตภัณฑ์ทำความสะอาดมือ (ตามมาตรฐาน WHO / IC)
export const AGENTS = [
  "Alcohol Hand Rub",
  "สบู่ธรรมดา (Plain soap)",
  "CHG",
  "Chlorhexidine + Alcohol",
  "Povidone-iodine",
  "Triclosan",
  "น้ำยาฆ่าเชื้ออื่นๆ",
] as const;
// ค่าพิเศษ: เลือกแล้วต้องกรอกชื่อน้ำยาเอง
export const AGENT_OTHER = "น้ำยาฆ่าเชื้ออื่นๆ"; 

export const QUARTERS = [
  { value: 1, label: "ไตรมาสที่ 1 (ต.ค.-ธ.ค.)" },
  { value: 2, label: "ไตรมาสที่ 2 (ม.ค.-มี.ค.)" },
  { value: 3, label: "ไตรมาสที่ 3 (เม.ย.-มิ.ย.)" },
  { value: 4, label: "ไตรมาสที่ 4 (ก.ค.-ก.ย.)" },
];

export const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

// ปีงบประมาณปัจจุบัน (พ.ศ.) — เดือน ต.ค. ขึ้นปีงบใหม่
export function currentFiscalYearBE(d = new Date()): number {
  const be = d.getFullYear() + 543;
  return d.getMonth() + 1 >= 10 ? be + 1 : be;
}

// "2026-07-14" → "14/07/2569"
export function fmtThaiDate(iso: string): string {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y + 543}`;
}

// ขั้นตอนการล้างมือ 7 ขั้นตอน (ตามโปสเตอร์มาตรฐาน)
export const HAND_WASH_STEPS = [
  "ฝ่ามือถูฝ่ามือ",
  "ฝ่ามือถูหลังมือ และซอกนิ้ว",
  "ฝ่ามือถูฝ่ามือ และซอกนิ้ว",
  "หลังนิ้วมือถูฝ่ามือ",
  "ถูนิ้วหัวแม่มือโดยรอบด้วยฝ่ามือ",
  "ปลายนิ้วมือถูขวางฝ่ามือ",
  "ถูรอบข้อมือ",
] as const;

// ระยะเวลาการล้างมือแต่ละแบบ (โชว์เป็นหมายเหตุ)
export const HAND_WASH_NOTES = [
  "ล้างมือธรรมดา ใช้เวลาอย่างน้อย 10 วินาที",
  "ล้างมือด้วยน้ำยาทำลายเชื้อ ใช้เวลาอย่างน้อย 30 วินาที",
  "ล้างมือก่อนทำหัตถการปลอดเชื้อ ใช้เวลา 3-5 นาที",
] as const;
