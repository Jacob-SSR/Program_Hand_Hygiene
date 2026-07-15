import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { cid, pin } = await req.json();
  if (!/^\d{13}$/.test(cid || "") || !/^\d{4}$/.test(pin || "")) {
    return NextResponse.json(
      { error: "กรอกเลข ปชช. 13 หลัก และรหัส 4 หลัก" },
      { status: 400 },
    );
  }
  // hash รหัสที่กรอกมา แล้วเทียบกับ hash ในฐาน (ไม่มีการ decrypt — hash เทียบ hash)
  const hash = crypto.createHash("sha256").update(pin).digest("hex");
  const user = await db().hygieneUser.findFirst({
    where: { cid, pinHash: hash, isActive: true },
    select: { id: true, fullName: true, role: true },
  });
  if (!user) {
    return NextResponse.json(
      { error: "เลขประจำตัวประชาชนหรือรหัสผ่านไม่ถูกต้อง" },
      { status: 401 },
    );
  }
  await createSession({ uid: user.id, name: user.fullName, role: user.role });
  return NextResponse.json({ ok: true, name: user.fullName });
}
