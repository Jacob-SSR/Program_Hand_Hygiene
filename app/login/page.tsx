"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [cid, setCid] = useState("");
    const [pin, setPin] = useState("");
    const [err, setErr] = useState("");
    const [ok, setOk] = useState(false);
    const [loading, setLoading] = useState(false);

    async function submit() {
        setErr("");
        setLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cid, pin }),
            });
            const data = await res.json();
            if (!res.ok) {
                setErr(data.error || "เข้าสู่ระบบไม่สำเร็จ");
                return;
            }
            setOk(true); // โชว์หน้า "เข้าสู่ระบบสำเร็จ" แบบต้นฉบับ
        } finally {
            setLoading(false);
        }
    }

    // หน้าสำเร็จ (ติ๊กเขียว) แบบโปรแกรมต้นฉบับ
    if (ok) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-slate-100 p-4">
                <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-4xl">
                        ✓
                    </div>
                    <h1 className="text-xl font-bold text-green-700">เข้าสู่ระบบสำเร็จ</h1>
                    <p className="mt-1 text-sm text-slate-500">ยินดีต้อนรับ</p>
                    <button
                        className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        onClick={() => { router.push("/"); router.refresh(); }}
                    >
                        ไปที่หน้าหลัก
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-slate-100 p-4">
            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 text-center">
                    <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-200 bg-emerald-50 text-3xl">
                        🖐️
                    </div>
                    <div className="text-xs font-semibold tracking-widest text-emerald-600">IC DATA</div>
                    <h1 className="mt-1 text-xl font-bold">เข้าสู่ระบบ</h1>
                    <p className="text-sm text-slate-500">
                        ระบบบันทึกการสังเกตการทำความสะอาดมือ<br />โรงพยาบาลพลับพลาชัย
                    </p>
                </div>

                <label className="mb-1 block text-sm font-semibold text-slate-600">ชื่อผู้ใช้</label>
                <input
                    className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="เลขประจำตัวประชาชน 13 หลัก"
                    inputMode="numeric"
                    maxLength={13}
                    value={cid}
                    onChange={(e) => setCid(e.target.value.replace(/\D/g, ""))}  // กรอกได้เฉพาะตัวเลข
                />

                <label className="mb-1 block text-sm font-semibold text-slate-600">รหัสผ่าน</label>
                <input
                    className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="รหัส 4 หลัก"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && submit()}   // กด Enter = login
                />

                {err && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}

                <button
                    className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    onClick={submit}
                    disabled={loading || cid.length !== 13 || pin.length !== 4}
                >
                    {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
                </button>

                <Link
                    href="/register"
                    className="mt-3 block w-full rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-center text-sm font-semibold text-white hover:opacity-90"
                >
                    สมัครสมาชิก
                </Link>
            </div>
        </main>
    );
}