import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { cid, pin, pin2, full_name } = await req.json();
  const name = String(full_name || "").trim();

  if (!name || name.length < 3)
    return NextResponse.json({ error: "กรุณากรอกชื่อ-สกุล" }, { status: 400 });
  if (!/^\d{13}$/.test(cid || ""))
    return NextResponse.json(
      { error: "เลขประจำตัวประชาชนต้องเป็นตัวเลข 13 หลัก" },
      { status: 400 },
    );
  if (!/^\d{4}$/.test(pin || ""))
    return NextResponse.json(
      { error: "รหัสผ่านต้องเป็นตัวเลข 4 หลัก" },
      { status: 400 },
    );
  if (pin !== pin2)
    return NextResponse.json(
      { error: "รหัสผ่านทั้งสองช่องไม่ตรงกัน" },
      { status: 400 },
    );

  const dup = await db().hygieneUser.findUnique({
    where: { cid },
    select: { id: true },
  });
  if (dup)
    return NextResponse.json(
      { error: "เลขประจำตัวประชาชนนี้สมัครไว้แล้ว กรุณาเข้าสู่ระบบ" },
      { status: 409 },
    );

  const pinHash = crypto.createHash("sha256").update(pin).digest("hex");
  const user = await db().hygieneUser.create({
    data: { cid, pinHash, fullName: name, role: "user" },
    select: { id: true, fullName: true, role: true },
  });

  await createSession({ uid: user.id, name: user.fullName, role: user.role });
  return NextResponse.json({ ok: true, name: user.fullName });
}
