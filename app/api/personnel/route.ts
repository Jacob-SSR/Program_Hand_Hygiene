import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// รวม 3 แหล่ง: users (ชื่อ-ฐานหลัก) + doctor/doctor_position (ตำแหน่งมาตรฐาน) + opduser (หน่วยงาน)
type StaffRow = {
  cid: string;
  name: string;
  position: string | null; // doctor_position ก่อน ไม่มีค่อยใช้ users.position
  groupname: string | null;
};

// GET /api/personnel?q=ชื่อ → ค้นหาบุคลากรทั้งหมด (ไม่กรองประเภท)
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const kw = (sp.get("q") || "").trim();

  const rows = await db().$queryRaw<StaffRow[]>`
    SELECT u.\`user\` AS cid,
           u.name,
           COALESCE(p.name, u.position) AS position,
           o.groupname
    FROM ppchos.users u
    LEFT JOIN ppchos.doctor d ON d.cid = u.\`user\` AND d.active = 'Y'
    LEFT JOIN ppchos.doctor_position p ON p.id = d.position_id
    LEFT JOIN ppchos.opduser o ON o.loginname = u.\`user\`
    WHERE u.name IS NOT NULL AND u.name <> ''
      AND u.name LIKE ${"%" + kw + "%"}
    ORDER BY u.name
    LIMIT 500
  `;

  // dedupe: join doctor อาจได้หลายแถวต่อคน — เก็บคนละ 1 แถว
  const uniq = new Map<string, StaffRow>();
  for (const r of rows) {
    if (r.cid && !uniq.has(r.cid)) uniq.set(r.cid, r);
  }

  return NextResponse.json(
    Array.from(uniq.values()).map((r) => ({
      cid: r.cid,
      full_name: r.name,
      position: r.position || null,
      unit_name: r.groupname || null,
    })),
  );
}
