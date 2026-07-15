import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// GET /api/personnel?q=ชื่อ → ค้นหาบุคลากร
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const kw = (sp.get("q") || "").trim();

  const rows = await db().hygienePersonnel.findMany({
    where: {
      isActive: true,
      ...(kw ? { fullName: { contains: kw } } : {}), // มีคำค้นค่อยกรอง
    },
    orderBy: { fullName: "asc" },
    take: 50, // กันเผลอดึงทั้งโรงพยาบาล
    include: { unit: { select: { name: true } } }, // join เอาชื่อหน่วยมาด้วย
  });

  // แปลงรูปทรงข้อมูลให้หน้าจอใช้ง่าย
  return NextResponse.json(
    rows.map((p) => ({
      id: p.id,
      full_name: p.fullName,
      position: p.position,
      unit_name: p.unit?.name ?? null,
    })),
  );
}
