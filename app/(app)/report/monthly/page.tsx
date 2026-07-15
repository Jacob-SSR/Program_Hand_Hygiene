"use client";

import { useMemo, useState } from "react";
import { fmtThaiDate, THAI_MONTHS } from "@/lib/constants";

type Obs = {
    id: number; fiscal_year: number; quarter: number; obs_no: number; obs_date: string;
    staff_type: string; moment: number; performed: number; agent: string | null;
    unit_name: string; personnel_name: string | null;
};

const td = "border border-slate-200 px-3 py-2";

export default function MonthlyReportPage() {
    const yNow = new Date().getFullYear() + 543;
    const [year, setYear] = useState("");
    const [month, setMonth] = useState("");
    const [rows, setRows] = useState<Obs[]>([]);
    const [loading, setLoading] = useState(false);
    const [kw, setKw] = useState("");

    async function load() {
        if (!year || !month) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/observations?year=${year}&month=${month}`);
            setRows(await res.json());
        } finally {
            setLoading(false);
        }
    }

    async function remove(id: number) {
        if (!confirm("ยืนยันการลบข้อมูลรายการนี้?")) return;
        const res = await fetch(`/api/observations/${id}`, { method: "DELETE" });
        if (res.ok) setRows((r) => r.filter((x) => x.id !== id));  // เอาออกจากตารางทันที ไม่ต้องโหลดใหม่
    }

    // ค้นหาในผลลัพธ์ (กรองฝั่งหน้าเว็บ ไม่ยิง API ซ้ำ)
    const filtered = useMemo(() => {
        if (!kw.trim()) return rows;
        const k = kw.trim().toLowerCase();
        return rows.filter((r) =>
            [r.staff_type, r.agent, r.unit_name, r.personnel_name, r.performed ? "ปฏิบัติ" : "ไม่ปฏิบัติ"]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(k))
        );
    }, [rows, kw]);

    return (
        <div className="space-y-4">
            <h1 className="text-lg font-bold text-emerald-700">รายงานแยกตามเดือน</h1>

            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-600">ปี (พ.ศ.)</label>
                    <select className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm" value={year} onChange={(e) => setYear(e.target.value)}>
                        <option value="">----กรุณาเลือก----</option>
                        {Array.from({ length: 5 }, (_, i) => yNow - i).map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-600">เดือน</label>
                    <select className="w-44 rounded-lg border border-slate-300 px-3 py-2 text-sm" value={month} onChange={(e) => setMonth(e.target.value)}>
                        <option value="">----กรุณาเลือก----</option>
                        {THAI_MONTHS.map((m, i) => (
                            <option key={m} value={i + 1}>{m}</option>
                        ))}
                    </select>
                </div>
                <button
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    onClick={load}
                    disabled={loading || !year || !month}
                >
                    🔍 {loading ? "กำลังโหลด..." : "ค้นหา"}
                </button>
                <input
                    className="ml-auto w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="ค้นหาในผลลัพธ์..."
                    value={kw}
                    onChange={(e) => setKw(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <table className="w-full min-w-[900px] border-collapse text-sm">
                    <thead>
                        <tr>
                            {["ที่", "ปีงบ", "ไตรมาส", "ครั้งที่สังเกต", "วันที่บันทึก", "หน่วยเบิก", "ประเภทบุคลากร", "Moment", "การปฏิบัติ", "น้ำยาที่ใช้ล้างมือ", "ลบ"].map((h) => (
                                <th key={h} className="border border-slate-200 bg-emerald-50 px-3 py-2 text-left font-semibold text-emerald-800">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((r, i) => (
                            <tr key={r.id} className="hover:bg-slate-50">
                                <td className={td}>{i + 1}</td>
                                <td className={td}>{r.fiscal_year}</td>
                                <td className={`${td} text-center`}>{r.quarter}</td>
                                <td className={`${td} text-center`}>{r.obs_no}</td>
                                <td className={td}>{fmtThaiDate(r.obs_date)}</td>
                                <td className={td}>{r.unit_name}</td>
                                <td className={td}>{r.staff_type}{r.personnel_name ? ` (${r.personnel_name})` : ""}</td>
                                <td className={`${td} text-center`}>{r.moment}</td>
                                <td className={`${td} ${r.performed ? "text-green-700" : "text-red-600"}`}>
                                    {r.performed ? "ปฏิบัติ" : "ไม่ปฏิบัติ"}
                                </td>
                                <td className={td}>{r.agent || ""}</td>
                                <td className={td}>
                                    <button className="text-red-500 hover:underline" onClick={() => remove(r.id)}>🗑 ลบ</button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={11} className={`${td} py-6 text-center text-slate-400`}>
                                    {rows.length === 0 ? "เลือกปีและเดือน แล้วกดค้นหา" : "ไม่พบข้อมูลที่ค้นหา"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <p className="mt-3 text-sm text-slate-500">ทั้งหมด {filtered.length} รายการ</p>
            </div>
        </div>
    );
}