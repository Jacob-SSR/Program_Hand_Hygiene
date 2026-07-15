import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// รันก่อนทุก request — หน้าที่เดียว: มีบัตรผ่านไหม (เดิมชื่อ middleware, Next.js เปลี่ยนชื่อ convention เป็น proxy)
export async function proxy(req: NextRequest) {
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
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (ok && isPublicPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
