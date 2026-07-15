import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// GET /api/reports/summary?from=2026-07-01&to=2026-07-31&unit=3(ไม่บังคับ)
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const from = sp.get("from");
  const to = sp.get("to");
  if (!from || !to)
    return NextResponse.json({ error: "ระบุช่วงวันที่" }, { status: 400 });

  const unit = sp.get("unit");
  // เงื่อนไขร่วมของทุกตาราง: ช่วงวันที่ (+หน่วย ถ้าเลือก)
  const where = {
    obsDate: { gte: new Date(from), lte: new Date(to) },
    ...(unit ? { unitId: Number(unit) } : {}),
  };

  // ตาราง 1: ภาพรวม — นับทั้งหมด + รวม performed (1=ปฏิบัติ ดังนั้น sum = จำนวนที่ล้างมือ)
  const overallAgg = await db().hygieneObservation.aggregate({
    where,
    _count: { _all: true },
    _sum: { performed: true },
  });

  // ตาราง 2: แยกตามประเภทบุคลากร
  const staffGroups = await db().hygieneObservation.groupBy({
    by: ["staffType"],
    where,
    _count: { _all: true },
    _sum: { performed: true },
    orderBy: { _count: { staffType: "desc" } },
  });

  // ตาราง 3: แยกตาม 5 Moments
  const momentGroups = await db().hygieneObservation.groupBy({
    by: ["moment"],
    where,
    _count: { _all: true },
    _sum: { performed: true },
    orderBy: { moment: "asc" },
  });

  // ตาราง 4: น้ำยาที่ใช้ (นับเฉพาะที่ปฏิบัติ)
  const agentGroups = await db().hygieneObservation.groupBy({
    by: ["agent"],
    where: { ...where, performed: 1, agent: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { agent: "desc" } },
  });

  // ชื่อหน่วยไว้ขึ้นหัวรายงาน
  let unitName = "ทุกหน่วยเบิก";
  if (unit) {
    const u = await db().hygieneUnit.findUnique({
      where: { id: Number(unit) },
      select: { code: true, name: true },
    });
    if (u) unitName = `${u.code} - ${u.name}`;
  }

  return NextResponse.json({
    overall: {
      performed: overallAgg._sum.performed ?? 0,
      observed: overallAgg._count._all,
    },
    byStaff: staffGroups.map((g) => ({
      staff_type: g.staffType,
      performed: g._sum.performed ?? 0,
      observed: g._count._all,
    })),
    byMoment: momentGroups.map((g) => ({
      moment: g.moment,
      performed: g._sum.performed ?? 0,
      observed: g._count._all,
    })),
    byAgent: agentGroups.map((g) => ({ agent: g.agent, cnt: g._count._all })),
    unitName,
  });
}
