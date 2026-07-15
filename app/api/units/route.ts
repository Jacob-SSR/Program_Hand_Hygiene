import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// GET /api/units → รายชื่อหน่วยเบิกทั้งหมด
export async function GET() {
  const rows = await db().hygieneUnit.findMany({
    where: { isActive: true }, // เอาเฉพาะที่ยังใช้งาน
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true }, // เลือกเฉพาะคอลัมน์ที่หน้าจอใช้
  });
  return NextResponse.json(rows);
}
