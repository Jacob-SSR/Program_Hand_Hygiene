"use client";

import { useEffect, useState } from "react";
import { fmtThaiDate, MOMENTS } from "@/lib/constants";

type Unit = { id: number; code: string; name: string };
type SummaryRow = { staff_type?: string; moment?: number; agent?: string; performed?: number; observed?: number; cnt?: number };
type Summary = {
    overall: { performed: number; observed: number };
    byStaff: SummaryRow[];
    byMoment: SummaryRow[];
    byAgent: SummaryRow[];
    unitName: string;
};

// คิด % ทศนิยม 2 ตำแหน่ง กันหารศูนย์
const pct = (p: number, o: number) => (o > 0 ? ((p / o) * 100).toFixed(2) : "0.00");

// หัวตารางสไตล์เดียวกันทุกตาราง
const th = "border border-slate-300 bg-emerald-50 px-3 py-2 font-semibold text-emerald-800";
const td = "border border-slate-300 px-3 py-2 text-center";

export default function SummaryReportPage() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [unit, setUnit] = useState("");
    const [data, setData] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    useEffect(() => {
        fetch("/api/units").then((r) => r.json()).then(setUnits);
    }, []);

    async function search() {
        setErr("");
        if (!from || !to) { setErr("กรุณาเลือกช่วงวันที่"); return; }
        setLoading(true);
        try {
            const sp = new URLSearchParams({ from, to });
            if (unit) sp.set("unit", unit);
            const res = await fetch(`/api/reports/summary?${sp}`);
            setData(await res.json());
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-4">
            {/* แถบค้นหา — print:hidden = หายตอนพิมพ์ */}
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
                <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-600">วันที่</label>
                    <input type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-600">ถึง</label>
                    <input type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-600">หน่วยเบิก</label>
                    <select className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm" value={unit} onChange={(e) => setUnit(e.target.value)}>
                        <option value="">ทุกหน่วยเบิก</option>
                        {units.map((u) => (
                            <option key={u.id} value={u.id}>{u.code} - {u.name}</option>
                        ))}
                    </select>
                </div>
                <button
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    onClick={search}
                    disabled={loading}
                >
                    🔍 {loading ? "กำลังค้นหา..." : "ค้นหา"}
                </button>
                {data && (
                    <button
                        className="ml-auto rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        onClick={() => window.print()}
                    >
                        🖨️ พิมพ์รายงาน
                    </button>
                )}
                {err && <p className="w-full text-sm text-red-600">{err}</p>}
            </div>

            {data && (
                <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm print:border-0 print:p-0 print:shadow-none">
                    <div className="text-center">
                        <p className="font-bold">รายงานข้อมูลของวันที่ {fmtThaiDate(from)} ถึงวันที่ {fmtThaiDate(to)}</p>
                        <p className="font-semibold">หน่วยเบิก {data.unitName}</p>
                    </div>

                    <section>
                        <h2 className="mb-2 font-bold">1. อัตราการล้างมือภาพรวม</h2>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr><th className={th}>จำนวนครั้งที่ล้างมือ</th><th className={th}>จำนวนที่สังเกต</th><th className={th}>% การล้างมือ</th></tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className={td}>{data.overall.performed}</td>
                                    <td className={td}>{data.overall.observed}</td>
                                    <td className={td}>{pct(data.overall.performed, data.overall.observed)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section>
                        <h2 className="mb-2 font-bold">2. อัตราการล้างมือตามประเภทบุคลากร</h2>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr><th className={th}>ประเภทบุคลากร</th><th className={th}>จำนวนครั้งที่ล้างมือ</th><th className={th}>จำนวนที่สังเกต</th><th className={th}>% การล้างมือ</th></tr>
                            </thead>
                            <tbody>
                                {data.byStaff.map((r) => (
                                    <tr key={r.staff_type}>
                                        <td className={`${td} text-left`}>{r.staff_type}</td>
                                        <td className={td}>{r.performed}</td>
                                        <td className={td}>{r.observed}</td>
                                        <td className={td}>{pct(r.performed!, r.observed!)}</td>
                                    </tr>
                                ))}
                                {data.byStaff.length === 0 && <tr><td colSpan={4} className={`${td} text-slate-400`}>ไม่มีข้อมูล</td></tr>}
                            </tbody>
                        </table>
                    </section>

                    <section>
                        <h2 className="mb-2 font-bold">3. อัตราการล้างมือตาม 5 Moments</h2>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr><th className={th}>Moments</th><th className={th}>จำนวนครั้งที่ล้างมือ</th><th className={th}>จำนวนที่สังเกต</th><th className={th}>% การล้างมือ</th></tr>
                            </thead>
                            <tbody>
                                {MOMENTS.map((m) => {
                                    const r = data.byMoment.find((x) => x.moment === m.value);
                                    return (
                                        <tr key={m.value}>
                                            <td className={`${td} text-left`}>Moment {m.value}</td>
                                            <td className={td}>{r?.performed ?? 0}</td>
                                            <td className={td}>{r?.observed ?? 0}</td>
                                            <td className={td}>{r ? pct(r.performed!, r.observed!) : "0.00"}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </section>

                    <section>
                        <h2 className="mb-2 font-bold">4. อัตราการล้างมือแยกตามประเภทน้ำยาล้างมือ</h2>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr><th className={th}>น้ำยาที่ใช้</th><th className={th}>จำนวนครั้ง</th></tr>
                            </thead>
                            <tbody>
                                {data.byAgent.map((r) => (
                                    <tr key={r.agent}>
                                        <td className={`${td} text-left`}>{r.agent}</td>
                                        <td className={td}>{r.cnt}</td>
                                    </tr>
                                ))}
                                {data.byAgent.length === 0 && <tr><td colSpan={2} className={`${td} text-slate-400`}>ไม่มีข้อมูล</td></tr>}
                            </tbody>
                        </table>
                    </section>
                </div>
            )}
        </div>
    );
}