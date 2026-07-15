"use client";

import { useCallback, useEffect, useState } from "react";
import {
    AGENTS, currentFiscalYearBE, fmtThaiDate, MOMENTS, QUARTERS, STAFF_TYPES,
    HAND_WASH_STEPS, HAND_WASH_NOTES,
} from "@/lib/constants";

type Unit = { id: number; code: string; name: string };
type Person = { id: number; full_name: string; position: string | null; unit_name: string | null };
type Latest = { fiscal_year: number; quarter: number; obs_no: number; obs_date: string } | null;

// วันนี้ในรูปแบบ YYYY-MM-DD ให้ <input type="date">
function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// แถวฟอร์มแบบต้นฉบับ: label ซ้าย (160px) - ฟิลด์ขวา
function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid items-start gap-2 py-2 sm:grid-cols-[160px_1fr]">
            <div className="pt-2 text-sm font-bold text-slate-700">{label}</div>
            <div>{children}</div>
        </div>
    );
}

export default function RecordPage() {
    const fyNow = currentFiscalYearBE();

    // ---- ข้อมูลอ้างอิง ----
    const [units, setUnits] = useState<Unit[]>([]);
    const [latest, setLatest] = useState<Latest>(null);

    // ---- ค่าในฟอร์ม ----
    const [year, setYear] = useState("");
    const [quarter, setQuarter] = useState("");
    const [unit, setUnit] = useState("");
    const [nextNo, setNextNo] = useState<number | null>(null);
    const [obsDate, setObsDate] = useState(todayISO());
    const [staffType, setStaffType] = useState("");
    const [person, setPerson] = useState<Person | null>(null);
    const [moment, setMoment] = useState("");
    const [performed, setPerformed] = useState("");
    const [agent, setAgent] = useState("");

    // ---- สถานะหน้าจอ ----
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
    const [saving, setSaving] = useState(false);
    const [showSteps, setShowSteps] = useState(false);   // กล่องความรู้ 7 ขั้นตอน

    // ---- popup ค้นหาบุคลากร ----
    const [showSearch, setShowSearch] = useState(false);
    const [kw, setKw] = useState("");
    const [results, setResults] = useState<Person[]>([]);

    // โหลดหน่วยเบิก + ข้อมูลบันทึกล่าสุด ครั้งเดียวตอนเปิดหน้า
    useEffect(() => {
        fetch("/api/units").then((r) => r.json()).then(setUnits);
    }, []);
    const loadLatest = useCallback(() => {
        fetch("/api/observations?latest=1").then((r) => r.json()).then(setLatest);
    }, []);
    useEffect(() => { loadLatest(); }, [loadLatest]);

    // เลือกปีงบ+ไตรมาส+หน่วยครบเมื่อไหร่ → ถามเลขครั้งที่สังเกตทันที
    const loadNextNo = useCallback(async () => {
        if (!year || !quarter || !unit) { setNextNo(null); return; }
        const sp = new URLSearchParams({ next_no: "1", year, quarter, unit });
        const res = await fetch(`/api/observations?${sp}`);
        const data = await res.json();
        setNextNo(data.next_no);
    }, [year, quarter, unit]);
    useEffect(() => { loadNextNo(); }, [loadNextNo]);

    async function searchPersonnel() {
        const sp = new URLSearchParams();
        if (kw) sp.set("q", kw);
        const res = await fetch(`/api/personnel?${sp}`);
        setResults(await res.json());
    }

    // ล้างเฉพาะส่วนที่สังเกต — คงปีงบ/ไตรมาส/หน่วยไว้บันทึกต่อ
    function clearObservation() {
        setStaffType("");
        setPerson(null);
        setMoment("");
        setPerformed("");
        setAgent("");
        setMsg(null);
    }

    async function save() {
        setMsg(null);
        setSaving(true);
        try {
            const res = await fetch("/api/observations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fiscal_year: year,
                    quarter,
                    unit_id: unit,
                    obs_date: obsDate,
                    staff_type: staffType,
                    personnel_id: person?.id ?? null,
                    moment,
                    performed: performed === "ปฏิบัติ",
                    agent: performed === "ปฏิบัติ" ? agent : null,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setMsg({ type: "err", text: data.error || "บันทึกไม่สำเร็จ" });
                return;
            }
            setMsg({ type: "ok", text: `บันทึกข้อมูลสำเร็จ (ครั้งที่สังเกต ${data.obs_no})` });
            clearObservation();
            loadNextNo();   // เลขครั้งถัดไปขยับ
            loadLatest();   // หัวฟอร์มอัปเดต
        } finally {
            setSaving(false);
        }
    }

    const momentDetail = MOMENTS.find((m) => String(m.value) === moment);

    return (
        <div className="mx-auto max-w-5xl space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                {/* หัวฟอร์ม: บันทึกครั้งล่าสุด แบบต้นฉบับ */}
                <p className="mb-4 text-sm font-semibold text-slate-700">
                    {latest
                        ? <>บันทึกข้อมูลครั้งล่าสุดเมื่อวันที่ {fmtThaiDate(latest.obs_date)} โดยเป็นข้อมูลของปีงบ {latest.fiscal_year} ไตรมาสที่ {latest.quarter} ครั้งที่สังเกต {latest.obs_no}</>
                        : "ยังไม่มีการบันทึกข้อมูล เริ่มบันทึกครั้งแรกได้เลย"}
                </p>

                <div className="divide-y divide-slate-100">
                    {/* ปีงบประมาณ + ไตรมาสที่ แถวเดียวกัน */}
                    <div className="grid items-start gap-2 py-2 sm:grid-cols-[160px_1fr_120px_1fr]">
                        <div className="pt-2 text-sm font-bold text-slate-700">ปีงบประมาณ</div>
                        <select className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm" value={year} onChange={(e) => setYear(e.target.value)}>
                            <option value="">----กรุณาเลือก----</option>
                            {Array.from({ length: 3 }, (_, i) => fyNow - i).map((y) => (
                                <option key={y} value={y}>ปีงบ {y}</option>
                            ))}
                        </select>
                        <div className="pt-2 text-sm font-bold text-slate-700 sm:text-center">ไตรมาสที่</div>
                        <select className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
                            <option value="">----กรุณาเลือก----</option>
                            {QUARTERS.map((qt) => (
                                <option key={qt.value} value={qt.value}>{qt.label}</option>
                            ))}
                        </select>
                    </div>

                    <Row label="หน่วยเบิก">
                        <select className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm" value={unit} onChange={(e) => setUnit(e.target.value)}>
                            <option value="">----กรุณาเลือก----</option>
                            {units.map((u) => (
                                <option key={u.id} value={u.id}>{u.code} - {u.name}</option>
                            ))}
                        </select>
                    </Row>

                    <Row label="ครั้งที่สังเกต">
                        <div className="relative max-w-[160px]">
                            <input className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 pr-8 text-sm" value={nextNo ?? ""} readOnly placeholder="-" />
                            {nextNo !== null && (
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600">✔</span>
                            )}
                        </div>
                    </Row>

                    <Row label="วันที่บันทึก">
                        <input type="date" className="max-w-[200px] rounded-lg border border-slate-300 px-3 py-2 text-sm" value={obsDate} onChange={(e) => setObsDate(e.target.value)} />
                    </Row>

                    <Row label="ประเภทบุคลากร">
                        <div className="flex flex-wrap items-center gap-2">
                            <select className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm" value={staffType} onChange={(e) => setStaffType(e.target.value)}>
                                <option value="">----กรุณาเลือก----</option>
                                {STAFF_TYPES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                onClick={() => { setShowSearch(true); setResults([]); setKw(""); }}
                            >
                                ค้นหาบุคลากร
                            </button>
                        </div>
                    </Row>

                    <Row label="เลือกประเมิน">
                        {person ? (
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-sm">
                                <span className="font-semibold">{person.full_name}</span>
                                <span><span className="font-bold text-slate-700">ตำแหน่ง</span> {person.position || "-"}</span>
                                <span><span className="font-bold text-slate-700">หน่วยงาน</span> {person.unit_name || "-"}</span>
                                <button className="text-red-500 hover:underline" onClick={() => setPerson(null)}>✕ ยกเลิก</button>
                            </div>
                        ) : (
                            <p className="pt-2 text-sm text-slate-400">— ไม่ระบุรายบุคคล (กดค้นหาบุคลากรหากต้องการประเมินรายบุคคล) —</p>
                        )}
                    </Row>

                    <Row label="Moment">
                        <div className="grid gap-2 lg:grid-cols-[260px_1fr]">
                            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={moment} onChange={(e) => setMoment(e.target.value)}>
                                <option value="">----กรุณาเลือก----</option>
                                {MOMENTS.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            {momentDetail && (
                                <p className="text-sm font-medium leading-relaxed text-slate-600">{momentDetail.detail}</p>
                            )}
                        </div>
                    </Row>

                    <Row label="การปฏิบัติ">
                        <select
                            className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            value={performed}
                            onChange={(e) => { setPerformed(e.target.value); if (e.target.value !== "ปฏิบัติ") setAgent(""); }}
                        >
                            <option value="">----กรุณาเลือก----</option>
                            <option value="ปฏิบัติ">ปฏิบัติ</option>
                            <option value="ไม่ปฏิบัติ">ไม่ปฏิบัติ</option>
                        </select>
                    </Row>

                    <Row label="น้ำยาที่ใช้ล้างมือ">
                        <select
                            className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                            value={agent}
                            onChange={(e) => setAgent(e.target.value)}
                            disabled={performed !== "ปฏิบัติ"}
                        >
                            <option value="">----กรุณาเลือก----</option>
                            {AGENTS.map((a) => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </Row>
                </div>

                {msg && (
                    <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                        {msg.text}
                    </p>
                )}

                {/* ปุ่มแบบต้นฉบับ */}
                <div className="mt-4 flex gap-3">
                    <button
                        className="rounded-lg border border-green-600 bg-white px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-600 hover:text-white disabled:opacity-50"
                        onClick={save}
                        disabled={saving}
                    >
                        🗎 {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                    </button>
                    <button
                        className="rounded-lg border border-red-400 bg-white px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-500 hover:text-white"
                        type="button"
                        onClick={clearObservation}
                    >
                        🗑 ลบข้อมูล
                    </button>
                </div>
            </div>

            {/* กล่องความรู้: 7 ขั้นตอนการล้างมือ (พับเก็บได้) */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <button className="flex w-full items-center justify-between text-sm font-semibold text-slate-700" onClick={() => setShowSteps(!showSteps)}>
                    <span>📖 ขั้นตอนการล้างมือ 7 ขั้นตอน</span>
                    <span>{showSteps ? "▲" : "▼"}</span>
                </button>
                {showSteps && (
                    <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
                        <ol className="list-inside list-decimal space-y-1 text-slate-600">
                            {HAND_WASH_STEPS.map((s) => <li key={s}>{s}</li>)}
                        </ol>
                        <ul className="space-y-1 text-slate-500">
                            {HAND_WASH_NOTES.map((n) => <li key={n}>• {n}</li>)}
                        </ul>
                    </div>
                )}
            </div>

            {/* Popup ค้นหาบุคลากร */}
            {showSearch && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20" onClick={() => setShowSearch(false)}>
                    <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="mb-2 font-bold text-emerald-700">ค้นหาข้อมูลบุคลากร</h2>
                        <div className="mb-3 flex gap-2">
                            <input
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                placeholder="ค้นหาจากชื่อ"
                                value={kw}
                                onChange={(e) => setKw(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && searchPersonnel()}
                                autoFocus
                            />
                            <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50" onClick={searchPersonnel}>
                                ตกลง
                            </button>
                        </div>
                        <div className="max-h-80 overflow-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr>
                                        {["ที่", "ชื่อ - สกุล", "ตำแหน่ง", "หน่วยงาน"].map((h) => (
                                            <th key={h} className="border border-slate-200 bg-emerald-50 px-3 py-2 text-left font-semibold text-emerald-800">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((p, i) => (
                                        <tr key={p.id} className="cursor-pointer hover:bg-emerald-50" onClick={() => { setPerson(p); setShowSearch(false); }}>
                                            <td className="border border-slate-200 px-3 py-2">{i + 1}</td>
                                            <td className="border border-slate-200 px-3 py-2">{p.full_name}</td>
                                            <td className="border border-slate-200 px-3 py-2">{p.position || "-"}</td>
                                            <td className="border border-slate-200 px-3 py-2">{p.unit_name || "-"}</td>
                                        </tr>
                                    ))}
                                    {results.length === 0 && (
                                        <tr><td colSpan={4} className="border border-slate-200 px-3 py-4 text-center text-slate-400">พิมพ์ชื่อแล้วกดตกลงเพื่อค้นหา</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}