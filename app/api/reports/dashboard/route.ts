import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// GET /api/reports/dashboard?year=2569&unit=3(ไม่บังคับ)
// year = ปีงบประมาณ พ.ศ. — กรองจากคอลัมน์ fiscal_year ตรง ๆ (ไม่ใช่วันที่)
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const year = Number(sp.get("year"));
  if (!year)
    return NextResponse.json({ error: "ระบุปีงบประมาณ" }, { status: 400 });

  const unit = sp.get("unit");
  const where = { fiscalYear: year, ...(unit ? { unitId: Number(unit) } : {}) };

  // กราฟ 1: รายไตรมาส
  const quarterGroups = await db().hygieneObservation.groupBy({
    by: ["quarter"],
    where,
    _count: { _all: true },
    _sum: { performed: true },
    orderBy: { quarter: "asc" },
  });

  // กราฟ 2: น้ำยาที่ใช้ (เฉพาะที่ปฏิบัติ)
  const agentGroups = await db().hygieneObservation.groupBy({
    by: ["agent"],
    where: { ...where, performed: 1, agent: { not: null } },
    _count: { _all: true },
  });

  // กราฟ 3: Moment × ไตรมาส (จัดกลุ่ม 2 ชั้น)
  const momentGroups = await db().hygieneObservation.groupBy({
    by: ["moment", "quarter"],
    where,
    _count: { _all: true },
    _sum: { performed: true },
    orderBy: [{ moment: "asc" }, { quarter: "asc" }],
  });

  // กราฟ 4: ประเภทบุคลากร × ไตรมาส
  const staffGroups = await db().hygieneObservation.groupBy({
    by: ["staffType", "quarter"],
    where,
    _count: { _all: true },
    _sum: { performed: true },
  });

  return NextResponse.json({
    byQuarter: quarterGroups.map((g) => ({
      quarter: g.quarter,
      performed: g._sum.performed ?? 0,
      observed: g._count._all,
    })),
    byAgent: agentGroups.map((g) => ({ agent: g.agent, cnt: g._count._all })),
    byMoment: momentGroups.map((g) => ({
      moment: g.moment,
      quarter: g.quarter,
      performed: g._sum.performed ?? 0,
      observed: g._count._all,
    })),
    byStaff: staffGroups.map((g) => ({
      staff_type: g.staffType,
      quarter: g.quarter,
      performed: g._sum.performed ?? 0,
      observed: g._count._all,
    })),
  });
}
