import Link from "next/link";
import { getSession } from "@/lib/auth";
import { NavLinks, LogoutButton, MobileNav } from "./nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const session = await getSession(); // อ่านชื่อจาก JWT cookie

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Topbar เขียวแบบต้นฉบับ */}
            <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-emerald-700 px-4 text-white shadow">
                <div className="flex items-center gap-3">
                    <MobileNav />
                    <Link href="/" className="flex items-center gap-2 font-bold">
                        <span className="text-xl">🖐️</span> Hand Hygiene
                    </Link>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <span className="hidden sm:inline">{session?.name}</span>
                    <LogoutButton />
                </div>
            </header>

            <div className="flex">
                {/* Sidebar ซ้าย (ซ่อนบนมือถือ ใช้ ☰ แทน) */}
                <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-slate-200 bg-white p-3 md:block">
                    <NavLinks />
                </aside>

                {/* children = หน้าที่กำลังเปิดอยู่ จะถูกเสียบตรงนี้ */}
                <main className="w-full min-w-0 p-4 md:p-6">{children}</main>
            </div>
        </div>
    );
}