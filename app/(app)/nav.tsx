"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const MENU = [
    { href: "/", label: "หน้าหลัก", icon: "🏠" },
    { href: "/record", label: "บันทึกข้อมูล", icon: "📝" },
];
const REPORT = [
    { href: "/report/summary", label: "รายงานภาพรวม", icon: "📄" },
    { href: "/report/monthly", label: "รายงานแยกตามเดือน", icon: "📅" },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname(); // path ปัจจุบัน ใช้เทียบว่าเมนูไหน active
    const item = (m: { href: string; label: string; icon: string }) => {
        const active = pathname === m.href;
        return (
            <Link
                key={m.href}
                href={m.href}
                onClick={onNavigate}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
                    }`}
            >
                <span>{m.icon}</span> {m.label}
            </Link>
        );
    };
    return (
        <nav className="flex flex-col gap-1">
            {MENU.map(item)}
            <div className="mt-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Report
            </div>
            {REPORT.map(item)}
        </nav>
    );
}

export function LogoutButton() {
    const router = useRouter();
    return (
        <button
            className="rounded-lg bg-emerald-900 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-950"
            onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" }); // ลบ cookie ฝั่ง server
                router.push("/login");
                router.refresh();
            }}
        >
            ออกจากระบบ
        </button>
    );
}

// เมนูมือถือ: ปุ่ม ☰ เปิด drawer ซ้าย
export function MobileNav() {
    const [open, setOpen] = useState(false);
    return (
        <div className="md:hidden">
            <button aria-label="เปิดเมนู" className="text-2xl leading-none" onClick={() => setOpen(true)}>
                ☰
            </button>
            {open && (
                <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
                    <div className="absolute inset-0 bg-black/40" />
                    <div
                        className="absolute left-0 top-0 h-full w-64 bg-white p-3 text-slate-800 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-2 flex items-center justify-between px-1">
                            <span className="font-bold text-emerald-700">เมนู</span>
                            <button className="text-xl" onClick={() => setOpen(false)}>✕</button>
                        </div>
                        <NavLinks onNavigate={() => setOpen(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}