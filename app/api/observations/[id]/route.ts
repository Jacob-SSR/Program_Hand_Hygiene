import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params; // Next.js 15: params เป็น Promise ต้อง await
  try {
    await db().hygieneObservation.delete({ where: { id: Number(id) } });
  } catch {
    return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
