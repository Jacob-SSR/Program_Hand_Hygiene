import { NextRequest, NextResponse } from "next/server";
import { db, toISODate } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { STAFF_TYPES, AGENTS, AGENT_OTHER } from "@/lib/constants";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  // โหมด 1: /api/observations?latest=1 → ข้อมูลบันทึกครั้งล่าสุด (โชว์หัวฟอร์ม)
  if (sp.get("latest")) {
    const o = await db().hygieneObservation.findFirst({
      orderBy: { id: "desc" },
      select: { fiscalYear: true, quarter: true, obsNo: true, obsDate: true },
    });
    return NextResponse.json(
      o
        ? {
            fiscal_year: o.fiscalYear,
            quarter: o.quarter,
            obs_no: o.obsNo,
            obs_date: toISODate(o.obsDate),
          }
        : null,
    );
  }

  // โหมด 2: ?next_no=1&year=2569&quarter=1&unit=3 → ครั้งที่สังเกตถัดไป
  // กติกา: เลขรันแยกกันต่อ ปีงบ+ไตรมาส+หน่วย (เอาเลขมากสุดที่มี +1)
  if (sp.get("next_no")) {
    const agg = await db().hygieneObservation.aggregate({
      where: {
        fiscalYear: Number(sp.get("year")),
        quarter: Number(sp.get("quarter")),
        unitId: Number(sp.get("unit")),
      },
      _max: { obsNo: true },
    });
    return NextResponse.json({ next_no: (agg._max.obsNo ?? 0) + 1 });
  }

  // โหมด 3: ?year=2569&month=7 → รายการข้อมูล (หน้ารายงานแยกตามเดือน)
  const where: Prisma.HygieneObservationWhereInput = {};
  const yearBE = sp.get("year") ? Number(sp.get("year")) : null;
  const month = sp.get("month") ? Number(sp.get("month")) : null;
  if (yearBE) {
    const ce = yearBE - 543; // ฐานเก็บ ค.ศ. — แปลงก่อนเทียบ
    where.obsDate = month
      ? {
          gte: new Date(Date.UTC(ce, month - 1, 1)),
          lt: new Date(Date.UTC(ce, month, 1)),
        }
      : {
          gte: new Date(Date.UTC(ce, 0, 1)),
          lt: new Date(Date.UTC(ce + 1, 0, 1)),
        };
  }
  if (sp.get("unit")) where.unitId = Number(sp.get("unit"));

  const rows = await db().hygieneObservation.findMany({
    where,
    orderBy: [{ obsDate: "asc" }, { obsNo: "asc" }],
    take: 1000,
    include: {
      unit: { select: { name: true } },
      personnel: { select: { fullName: true } },
    },
  });

  return NextResponse.json(
    rows.map((o) => ({
      id: o.id,
      fiscal_year: o.fiscalYear,
      quarter: o.quarter,
      obs_no: o.obsNo,
      obs_date: toISODate(o.obsDate),
      staff_type: o.staffType,
      moment: o.moment,
      performed: o.performed,
      agent: o.agent,
      unit_name: o.unit.name,
      personnel_name: o.personnel?.fullName ?? null,
    })),
  );
}

// POST /api/observations → บันทึกการสังเกต 1 กิจกรรม
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json();
  const fiscalYear = Number(b.fiscal_year);
  const quarter = Number(b.quarter);
  const unitId = Number(b.unit_id);
  const moment = Number(b.moment);
  const performed = b.performed ? 1 : 0;
  const agentBase = performed ? String(b.agent || "") : null;
  const agentOther = String(b.agent_other || "").trim();

  if (!fiscalYear || quarter < 1 || quarter > 4 || !unitId)
    return NextResponse.json({ error: "กรุณาเลือกปีงบประมาณ ไตรมาส และหน่วยเบิก" }, { status: 400 });
  if (!STAFF_TYPES.includes(b.staff_type))
    return NextResponse.json({ error: "ประเภทบุคลากรไม่ถูกต้อง" }, { status: 400 });
  if (moment < 1 || moment > 5)
    return NextResponse.json({ error: "Moment ไม่ถูกต้อง" }, { status: 400 });
  if (performed && !(AGENTS as readonly string[]).includes(agentBase ?? ""))
    return NextResponse.json({ error: "กรุณาเลือกน้ำยาที่ใช้ทำความสะอาดมือ" }, { status: 400 });
  if (performed && agentBase === AGENT_OTHER && !agentOther)
    return NextResponse.json({ error: "กรุณาระบุชื่อน้ำยาฆ่าเชื้ออื่นๆ" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.obs_date || ""))
    return NextResponse.json({ error: "วันที่บันทึกไม่ถูกต้อง" }, { status: 400 });

  const agent = !performed
    ? null
    : agentBase === AGENT_OTHER
      ? `อื่นๆ: ${agentOther}`
      : agentBase;

  // ประเมินรายบุคคล: lazy copy จาก ppchos.users → hygiene_personnel
  let personnelId: number | null = null;
  if (b.personnel_cid) {
    const cid = String(b.personnel_cid);
    const fullName = String(b.personnel_name || "").trim();
    if (!fullName)
      return NextResponse.json({ error: "ข้อมูลบุคลากรไม่ครบถ้วน" }, { status: 400 });

    const found = await db().hygienePersonnel.findFirst({ where: { cid } });
    if (found) {
      // อัปเดตชื่อ/ตำแหน่งให้ตรงกับ HOSxP ล่าสุด
      const updated = await db().hygienePersonnel.update({
        where: { id: found.id },
        data: { fullName, position: b.personnel_position ?? found.position },
      });
      personnelId = updated.id;
    } else {
      const created = await db().hygienePersonnel.create({
        data: { cid, fullName, position: b.personnel_position ?? null },
      });
      personnelId = created.id;
    }
  }

  const agg = await db().hygieneObservation.aggregate({
    where: { fiscalYear, quarter, unitId },
    _max: { obsNo: true },
  });
  const obsNo = (agg._max.obsNo ?? 0) + 1;

  await db().hygieneObservation.create({
    data: {
      fiscalYear,
      quarter,
      obsNo,
      obsDate: new Date(b.obs_date),
      unitId,
      staffType: b.staff_type,
      personnelId,
      moment,
      performed,
      agent,
      createdBy: s.uid,
    },
  });
  return NextResponse.json({ ok: true, obs_no: obsNo });
}