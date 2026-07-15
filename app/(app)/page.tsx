"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
} from "recharts";
import { currentFiscalYearBE, MOMENTS, STAFF_TYPES } from "@/lib/constants";

type Unit = { id: number; code: string; name: string };
type Dash = {
    byQuarter: { quarter: number; performed: number; observed: number }[];
    byAgent: { agent: string; cnt: number }[];
    byMoment: { moment: number; quarter: number; performed: number; observed: number }[];
    byStaff: { staff_type: string; quarter: number; performed: number; observed: number }[];
};

const QLABEL = ["", "ไตรมาส 1", "ไตรมาส 2", "ไตรมาส 3", "ไตรมาส 4"];
const QCOLORS = ["#1e3a8a", "#0ea5e9", "#dc2626", "#7c3aed"];      // สีแท่งแต่ละไตรมาส
const PIE_COLORS = ["#059669", "#f59e0b", "#0ea5e9", "#94a3b8"];   // สีโดนัทน้ำยา
const rate = (p: number, o: number) => (o > 0 ? Math.round((p / o) * 10000) / 100 : 0);

const card = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";

export default function DashboardPage() {
    const fyNow = currentFiscalYearBE();
    const [year, setYear] = useState(fyNow);
    const [unit, setUnit] = useState("");
    const [units, setUnits] = useState<Unit[]>([]);
    const [data, setData] = useState<Dash | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch("/api/units").then((r) => r.json()).then(setUnits);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const sp = new URLSearchParams({ year: String(year) });
            if (unit) sp.set("unit", unit);
            const res = await fetch(`/api/reports/dashboard?${sp}`);
            setData(await res.json());
        } finally {
            setLoading(false);
        }
    }, [year, unit]);
    useEffect(() => { load(); }, [load]);   // โหลดอัตโนมัติเมื่อเปลี่ยนปี/หน่วย

    // ---- จัดรูปข้อมูลให้แต่ละกราฟ (useMemo = คำนวณใหม่เฉพาะตอน data เปลี่ยน) ----

    // กราฟเส้น: จำนวนสังเกต + อัตรา % ครบ 4 ไตรมาสเสมอ (ไตรมาสที่ไม่มีข้อมูล = 0)
    const quarterChart = useMemo(() => {
        if (!data) return [];
        return [1, 2, 3, 4].map((qt) => {
            const row = data.byQuarter.find((r) => r.quarter === qt);
            return {
                name: QLABEL[qt],
                "จำนวนที่สังเกต": row?.observed ?? 0,
                "อัตราการล้างมือ (%)": row ? rate(row.performed, row.observed) : 0,
            };
        });
    }, [data]);

    const agentChart = useMemo(
        () => data?.byAgent.map((r) => ({ name: r.agent, value: r.cnt })) ?? [],
        [data]
    );

    // แท่งกลุ่ม: แกน X = Moment, แท่งย่อย = ไตรมาส (ค่าเป็น %)
    const momentChart = useMemo(() => {
        if (!data) return [];
        return MOMENTS.map((m) => {
            const row: Record<string, string | number> = { name: `Moment ${m.value}` };
            for (const qt of [1, 2, 3, 4]) {
                const f = data.byMoment.find((r) => r.moment === m.value && r.quarter === qt);
                row[QLABEL[qt]] = f ? rate(f.performed, f.observed) : 0;
            }
            return row;
        });
    }, [data]);

    // แท่งกลุ่ม: แกน X = ประเภทบุคลากร (เอาเฉพาะประเภทที่มีข้อมูลจริง)
    const staffChart = useMemo(() => {
        if (!data) return [];
        return STAFF_TYPES.filter((s) => data.byStaff.some((r) => r.staff_type === s)).map((s) => {
            const row: Record<string, string | number> = { name: s };
            for (const qt of [1, 2, 3, 4]) {
                const f = data.byStaff.find((r) => r.staff_type === s && r.quarter === qt);
                row[QLABEL[qt]] = f ? rate(f.performed, f.observed) : 0;
            }
            return row;
        });
    }, [data]);

    // ป้ายสรุปภาพรวมทั้งปี
    const overall = useMemo(() => {
        if (!data?.byQuarter.length) return null;
        const p = data.byQuarter.reduce((a, r) => a + r.performed, 0);
        const o = data.byQuarter.reduce((a, r) => a + r.observed, 0);
        return { p, o, r: rate(p, o) };
    }, [data]);

    return (
        <div className="space-y-4">
            {/* ตัวกรอง */}
            <div className={`${card} flex flex-wrap items-end gap-3`}>
                <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-600">ปีงบประมาณ</label>
                    <select className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                        {Array.from({ length: 5 }, (_, i) => fyNow - i).map((y) => (
                            <option key={y} value={y}>ปีงบ {y}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-600">หน่วยเบิก</label>
                    <select className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm" value={unit} onChange={(e) => setUnit(e.target.value)}>
                        <option value="">ภาพรวมทุกหน่วย</option>
                        {units.map((u) => (
                            <option key={u.id} value={u.id}>{u.code} - {u.name}</option>
                        ))}
                    </select>
                </div>
                {loading && <span className="pb-2 text-sm text-slate-400">กำลังโหลด...</span>}
            </div>

            <h1 className="text-lg font-bold text-emerald-700">
                อัตราการทำความสะอาดมือ ปีงบประมาณ {year}
                {overall && overall.o > 0 && (
                    <span className="ml-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                        ภาพรวม {overall.r}% ({overall.p}/{overall.o} กิจกรรม)
                    </span>
                )}
            </h1>

            <div className="grid gap-4 lg:grid-cols-3">
                {/* กราฟเส้นรายไตรมาส */}
                <div className={`${card} lg:col-span-2`}>
                    <h2 className="mb-2 font-semibold text-slate-700">จำนวนกิจกรรมที่สังเกต / ไตรมาส (เป้าหมาย 200 ต่อไตรมาส)</h2>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={quarterChart}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis fontSize={12} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="จำนวนที่สังเกต" stroke="#047857" strokeWidth={2} />
                            <Line type="monotone" dataKey="อัตราการล้างมือ (%)" stroke="#0ea5e9" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* โดนัทน้ำยา */}
                <div className={card}>
                    <h2 className="mb-2 font-semibold text-slate-700">น้ำยาที่ใช้ทำความสะอาดมือ</h2>
                    {agentChart.length === 0 ? (
                        <p className="py-16 text-center text-sm text-slate-400">ยังไม่มีข้อมูล</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={agentChart} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} label>
                                    {agentChart.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* แท่ง Moments */}
            <div className={card}>
                <h2 className="mb-2 font-semibold text-slate-700">อัตราการทำความสะอาดมือแยกตาม Moments (%)</h2>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={momentChart}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis domain={[0, 100]} fontSize={12} />
                        <Tooltip />
                        <Legend />
                        {[1, 2, 3, 4].map((qt) => (
                            <Bar key={qt} dataKey={QLABEL[qt]} fill={QCOLORS[qt - 1]} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* แท่งประเภทบุคลากร */}
            <div className={card}>
                <h2 className="mb-2 font-semibold text-slate-700">อัตราการทำความสะอาดมือแยกตามประเภทบุคลากร (%)</h2>
                {staffChart.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-400">ยังไม่มีข้อมูล</p>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={staffChart}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis domain={[0, 100]} fontSize={12} />
                            <Tooltip />
                            <Legend />
                            {[1, 2, 3, 4].map((qt) => (
                                <Bar key={qt} dataKey={QLABEL[qt]} fill={QCOLORS[qt - 1]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}