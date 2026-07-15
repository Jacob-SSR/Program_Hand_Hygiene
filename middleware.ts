import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// รันก่อน "ทุก" request — หน้าที่เดียว: มีบัตรผ่านไหม
export async function middleware(req: NextRequest) {
  const token = req.cookies.get("hh_token")?.value;
  let ok = false;
  if (token) {
    try {
      await jwtVerify(
        token,
        new TextEncoder().encode(process.env.HH_JWT_SECRET || "dev-secret"),
      );
      ok = true;
    } catch {}
  }

  const isPublicPage = ["/login", "/register"].includes(req.nextUrl.pathname);

  if (!ok && !isPublicPage) {
    // ไม่มีบัตร + จะเข้าหน้าใน → เด้งไป login
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (ok && isPublicPage) {
    // มีบัตรแล้วยังจะเข้า login → ส่งกลับหน้าหลัก
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next(); // ผ่านได้
}

// ยกเว้น: api/auth (ไม่งั้น login ไม่ได้), ไฟล์ระบบของ Next
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
