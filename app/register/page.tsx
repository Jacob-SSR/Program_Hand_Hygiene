"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [cid, setCid] = useState("");
    const [pin, setPin] = useState("");
    const [pin2, setPin2] = useState("");
    const [err, setErr] = useState("");
    const [ok, setOk] = useState(false);
    const [loading, setLoading] = useState(false);

    const canSubmit =
        fullName.trim().length >= 3 && cid.length === 13 && pin.length === 4 && pin2.length === 4;

    async function submit() {
        setErr("");
        setLoading(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ full_name: fullName, cid, pin, pin2 }),
            });
            const data = await res.json();
            if (!res.ok) {
                setErr(data.error || "สมัครสมาชิกไม่สำเร็จ");
                return;
            }
            setOk(true);
        } finally {
            setLoading(false);
        }
    }

    if (ok) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-slate-100 p-4">
                <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-4xl">
                        ✓
                    </div>
                    <h1 className="text-xl font-bold text-green-700">สมัครสมาชิกสำเร็จ</h1>
                    <p className="mt-1 text-sm text-slate-500">เข้าสู่ระบบให้อัตโนมัติแล้ว ยินดีต้อนรับ</p>
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
                    <h1 className="mt-1 text-xl font-bold">สมัครสมาชิก</h1>
                    <p className="text-sm text-slate-500">
                        ระบบบันทึกการสังเกตการทำความสะอาดมือ<br />โรงพยาบาลพลับพลาชัย
                    </p>
                </div>

                <label className="mb-1 block text-sm font-semibold text-slate-600">ชื่อ - สกุล</label>
                <input
                    className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="เช่น สมหญิง ใจดี"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                />

                <label className="mb-1 block text-sm font-semibold text-slate-600">เลขประจำตัวประชาชน</label>
                <input
                    className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="13 หลัก (ใช้เป็นชื่อผู้ใช้)"
                    inputMode="numeric"
                    maxLength={13}
                    value={cid}
                    onChange={(e) => setCid(e.target.value.replace(/\D/g, ""))}
                />

                <div className="mb-3 grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-600">รหัสผ่าน 4 หลัก</label>
                        <input
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-600">ยืนยันรหัสผ่าน</label>
                        <input
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={pin2}
                            onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))}
                            onKeyDown={(e) => e.key === "Enter" && canSubmit && submit()}
                        />
                    </div>
                </div>

                {err && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}

                <button
                    className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    onClick={submit}
                    disabled={loading || !canSubmit}
                >
                    {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
                </button>

                <p className="mt-3 text-center text-sm text-slate-500">
                    มีบัญชีอยู่แล้ว?{" "}
                    <Link href="/login" className="font-semibold text-emerald-600 hover:underline">
                        เข้าสู่ระบบ
                    </Link>
                </p>
            </div>
        </main>
    );
}