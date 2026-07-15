import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "hh_token";

// แปลง secret จาก .env เป็น bytes ให้ jose ใช้เซ็น/ตรวจ token
function secret() {
  return new TextEncoder().encode(process.env.HH_JWT_SECRET || "dev-secret");
}

export type Session = { uid: number; name: string; role: string };

// เรียกตอน login/register สำเร็จ: สร้าง JWT แล้วฝากไว้ใน cookie
export async function createSession(s: Session) {
  const token = await new SignJWT(s)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h") // token อายุ 12 ชม. (1 เวร)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, // JS ฝั่ง browser อ่าน cookie นี้ไม่ได้ กันขโมย token
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

// เรียกใน API ที่ต้องรู้ว่า "ใครกำลังยิงมา" — คืน null ถ้าไม่ได้ login
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as Session;
  } catch {
    return null; // token ปลอม/หมดอายุ = ถือว่าไม่ได้ login
  }
}

// logout = ลบ cookie ทิ้ง
export async function destroySession() {
  (await cookies()).delete(COOKIE);
}
