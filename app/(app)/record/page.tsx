"use client";

import { useEffect, useState } from "react";
import {
    AGENTS, AGENT_OTHER, currentFiscalYearBE, fmtThaiDate, MOMENTS, QUARTERS,
    STAFF_TYPES,
    HAND_WASH_STEPS, HAND_WASH_NOTES,
} from "@/lib/constants";
import { useToast } from "../toast";

type Unit = { id: number; code: string; name: string };
type Person = { cid: string; full_name: string; position: string | null; unit_name: string | null };
type Latest = { fiscal_year: number; quarter: number; obs_no: number; obs_date: string } | null;

// วันนี้ในรูปแบบ YYYY-MM-DD ให้ <input type="date">
function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// คลาสของ input/select ทุกช่อง — invalid = โชว์ขอบแดงตอนกดบันทึกแล้วยังไม่กรอก
function fieldCls(invalid = false) {
    return `rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 ${invalid ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
        }`;
}

// แถวฟอร์มแบบต้นฉบับ: label ซ้าย (160px) - ฟิลด์ขวา
function Row({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="grid items-start gap-2 py-2 sm:grid-cols-[160px_1fr]">
            <div className="pt-2 text-sm font-bold text-slate-700">
                {label}
                {required && <span className="ml-0.5 text-red-500" title="จำเป็นต้องกรอก">*</span>}
            </div>
            <div>{children}</div>
        </div>
    );
}

// หัวข้อย่อยแบ่งหมวดในฟอร์ม ให้กวาดตาหาช่องได้เร็วขึ้น
function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="pb-1 pt-3 text-sm font-bold text-emerald-700">{children}</h2>;
}

export default function RecordPage() {
    const fyNow = currentFiscalYearBE();
    const toast = useToast();

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
    const [agentOther, setAgentOther] = useState("");   // ชื่อน้ำยาที่กรอกเอง

    // ---- สถานะหน้าจอ ----
    const [saving, setSaving] = useState(false);
    const [tried, setTried] = useState(false);           // กดบันทึกแล้ว → เริ่มไฮไลต์ช่องที่ยังไม่กรอก
    const [showSteps, setShowSteps] = useState(false);   // กล่องความรู้ 7 ขั้นตอน

    // ตัวสะกิด: บันทึกสำเร็จเมื่อไหร่ +1 เพื่อให้ effect โหลด latest + next_no ใหม่
    const [refresh, setRefresh] = useState(0);

    // ---- popup ค้นหาบุคลากร ----
    const [showSearch, setShowSearch] = useState(false);
    const [kw, setKw] = useState("");
    const [results, setResults] = useState<Person[]>([]);

    // โหลดหน่วยเบิก ครั้งเดียวตอนเปิดหน้า
    useEffect(() => {
        fetch("/api/units").then((r) => r.json()).then(setUnits);
    }, []);

    // โหลดข้อมูลบันทึกล่าสุด (ตอนเปิดหน้า + หลังบันทึกสำเร็จ)
    useEffect(() => {
        let alive = true;
        fetch("/api/observations?latest=1")
            .then((r) => r.json())
            .then((d) => { if (alive) setLatest(d); });
        return () => { alive = false; };
    }, [refresh]);

    // เลือกปีงบ+ไตรมาส+หน่วยครบ → ถามเลขครั้งที่สังเกต (และโหลดใหม่หลังบันทึก)
    useEffect(() => {
        if (!year || !quarter || !unit) return;   // ไม่ครบ = ไม่ทำอะไร (ค่า null ถูกเคลียร์ที่ onChange แล้ว)
        let alive = true;
        const sp = new URLSearchParams({ next_no: "1", year, quarter, unit });
        fetch(`/api/observations?${sp}`)
            .then((r) => r.json())
            .then((d) => { if (alive) setNextNo(d.next_no); });
        return () => { alive = false; };
    }, [year, quarter, unit, refresh]);

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
        setAgentOther("");
        setTried(false);
    }

    // ช่องที่จำเป็นแต่ยังไม่กรอก — ใช้ทั้งกันบันทึกและไฮไลต์ขอบแดง
    const missing = {
        year: !year,
        quarter: !quarter,
        unit: !unit,
        obsDate: !obsDate,
        staffType: !staffType,
        moment: !moment,
        performed: !performed,
        agent: performed === "ปฏิบัติ" && !agent,
        agentOther: performed === "ปฏิบัติ" && agent === AGENT_OTHER && !agentOther.trim(),
    };
    const hasMissing = Object.values(missing).some(Boolean);

    async function save() {
        setTried(true);
        if (hasMissing) {
            toast("error", "กรุณากรอกข้อมูลให้ครบถ้วน (ช่องที่ขาดถูกไฮไลต์ด้วยกรอบสีแดง)");
            return;
        }
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
                    personnel_cid: person?.cid ?? null,
                    personnel_name: person?.full_name ?? null,
                    personnel_position: person?.position ?? null,
                    moment,
                    performed: performed === "ปฏิบัติ",
                    agent: performed === "ปฏิบัติ" ? agent : null,
                    agent_other: performed === "ปฏิบัติ" && agent === AGENT_OTHER ? agentOther.trim() : null,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast("error", data.error || "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
                return;
            }
            toast("success", `บันทึกข้อมูลสำเร็จ (ครั้งที่สังเกต ${data.obs_no})`);
            clearObservation();
            setRefresh((n) => n + 1);   // สะกิดให้ effect โหลด latest + next_no ใหม่
        } catch {
            toast("error", "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setSaving(false);
        }
    }

    const momentDetail = MOMENTS.find((m) => String(m.value) === moment);

    return (
        <div className="mx-auto max-w-5xl space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                {/* หัวฟอร์ม: บันทึกครั้งล่าสุด */}
                <p className="mb-2 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                    <span aria-hidden>🕘</span>
                    <span>
                        {latest
                            ? <>บันทึกข้อมูลครั้งล่าสุดเมื่อวันที่ {fmtThaiDate(latest.obs_date)} โดยเป็นข้อมูลของปีงบ {latest.fiscal_year} ไตรมาสที่ {latest.quarter} ครั้งที่สังเกต {latest.obs_no}</>
                            : "ยังไม่มีการบันทึกข้อมูล เริ่มบันทึกครั้งแรกได้เลย"}
                    </span>
                </p>

                <SectionTitle>รอบการสังเกต</SectionTitle>
                <div className="divide-y divide-slate-100">
                    {/* ปีงบประมาณ + ไตรมาสที่ แถวเดียวกัน */}
                    <div className="grid items-start gap-2 py-2 sm:grid-cols-[160px_1fr_120px_1fr]">
                        <div className="pt-2 text-sm font-bold text-slate-700">ปีงบประมาณ<span className="ml-0.5 text-red-500" title="จำเป็นต้องกรอก">*</span></div>
                        <select
                            className={`w-full max-w-xs ${fieldCls(tried && missing.year)}`}
                            value={year}
                            onChange={(e) => { setYear(e.target.value); setNextNo(null); }}
                        >
                            <option value="">----กรุณาเลือก----</option>
                            {Array.from({ length: 3 }, (_, i) => fyNow - i).map((y) => (
                                <option key={y} value={y}>ปีงบ {y}</option>
                            ))}
                        </select>
                        <div className="pt-2 text-sm font-bold text-slate-700 sm:text-center">ไตรมาสที่<span className="ml-0.5 text-red-500" title="จำเป็นต้องกรอก">*</span></div>
                        <select
                            className={`w-full max-w-xs ${fieldCls(tried && missing.quarter)}`}
                            value={quarter}
                            onChange={(e) => { setQuarter(e.target.value); setNextNo(null); }}
                        >
                            <option value="">----กรุณาเลือก----</option>
                            {QUARTERS.map((qt) => (
                                <option key={qt.value} value={qt.value}>{qt.label}</option>
                            ))}
                        </select>
                    </div>

                    <Row label="หน่วยเบิก" required>
                        <select
                            className={`w-full max-w-xs ${fieldCls(tried && missing.unit)}`}
                            value={unit}
                            onChange={(e) => { setUnit(e.target.value); setNextNo(null); }}
                        >
                            <option value="">----กรุณาเลือก----</option>
                            {units.map((u) => (
                                <option key={u.id} value={u.id}>{u.code} - {u.name}</option>
                            ))}
                        </select>
                    </Row>

                    <Row label="ครั้งที่สังเกต">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative max-w-[160px]">
                                <input className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 pr-8 text-sm" value={nextNo ?? ""} readOnly placeholder="-" />
                                {nextNo !== null && (
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600">✔</span>
                                )}
                            </div>
                            {nextNo === null && (
                                <span className="text-xs text-slate-400">ระบบรันเลขให้อัตโนมัติเมื่อเลือกปีงบ ไตรมาส และหน่วยเบิกครบ</span>
                            )}
                        </div>
                    </Row>

                    <Row label="วันที่บันทึก" required>
                        <input type="date" className={`max-w-[200px] ${fieldCls(tried && missing.obsDate)}`} value={obsDate} onChange={(e) => setObsDate(e.target.value)} />
                    </Row>
                </div>

                <SectionTitle>ข้อมูลการสังเกต</SectionTitle>
                <div className="divide-y divide-slate-100">
                    <Row label="ประเภทบุคลากร" required>
                        <div className="flex flex-wrap items-center gap-2">
                            <select className={`w-full max-w-xs ${fieldCls(tried && missing.staffType)}`} value={staffType} onChange={(e) => setStaffType(e.target.value)}>
                                <option value="">----กรุณาเลือก----</option>
                                {STAFF_TYPES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                                onClick={() => {
                                    setShowSearch(true);
                                    setKw("");
                                    fetch("/api/personnel").then((r) => r.json()).then(setResults);
                                }}
                            >
                                🔍 ค้นหาบุคลากร
                            </button>
                        </div>
                    </Row>

                    <Row label="เลือกประเมิน">
                        {person ? (
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-sm">
                                <span className="font-semibold">{person.full_name}</span>
                                <span><span className="font-bold text-slate-700">ตำแหน่ง</span> {person.position || "-"}</span>
                                <span><span className="font-bold text-slate-700">หน่วยงาน</span> {person.unit_name || "-"}</span>
                                <button className="text-red-500 transition hover:underline" onClick={() => setPerson(null)}>✕ ยกเลิก</button>
                            </div>
                        ) : (
                            <p className="pt-2 text-sm text-slate-400">— ไม่ระบุรายบุคคล (กดค้นหาบุคลากรหากต้องการประเมินรายบุคคล) —</p>
                        )}
                    </Row>

                    <Row label="Moment" required>
                        <div className="grid gap-2 lg:grid-cols-[260px_1fr]">
                            <select className={fieldCls(tried && missing.moment)} value={moment} onChange={(e) => setMoment(e.target.value)}>
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

                    <Row label="การปฏิบัติ" required>
                        <select
                            className={`w-full max-w-xs ${fieldCls(tried && missing.performed)}`}
                            value={performed}
                            onChange={(e) => { setPerformed(e.target.value); if (e.target.value !== "ปฏิบัติ") setAgent(""); }}
                        >
                            <option value="">----กรุณาเลือก----</option>
                            <option value="ปฏิบัติ">ปฏิบัติ</option>
                            <option value="ไม่ปฏิบัติ">ไม่ปฏิบัติ</option>
                        </select>
                    </Row>

                    <Row label="น้ำยาที่ใช้ล้างมือ" required={performed === "ปฏิบัติ"}>
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                className={`w-full max-w-xs ${fieldCls(tried && missing.agent)}`}
                                value={agent}
                                onChange={(e) => { setAgent(e.target.value); if (e.target.value !== AGENT_OTHER) setAgentOther(""); }}
                                disabled={performed !== "ปฏิบัติ"}
                            >
                                <option value="">----กรุณาเลือก----</option>
                                {AGENTS.map((a) => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>
                            {performed !== "ปฏิบัติ" && (
                                <span className="text-xs text-slate-400">เลือกได้เมื่อ &quot;การปฏิบัติ&quot; เป็น ปฏิบัติ</span>
                            )}
                            {agent === AGENT_OTHER && (
                                <input
                                    className={`w-full max-w-xs rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-amber-200 ${tried && missing.agentOther ? "border-red-400 bg-red-50" : "border-amber-400 bg-amber-50"}`}
                                    placeholder="ระบุชื่อน้ำยา เช่น Hibiscrub"
                                    value={agentOther}
                                    onChange={(e) => setAgentOther(e.target.value)}
                                    autoFocus
                                />
                            )}
                        </div>
                    </Row>
                </div>

                {/* ปุ่มบันทึก (หลัก) + ล้างฟอร์ม (รอง) */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={save}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
                                กำลังบันทึก...
                            </>
                        ) : (
                            <>🗎 บันทึกข้อมูล</>
                        )}
                    </button>
                    <button
                        className="rounded-lg border border-red-400 bg-white px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500 hover:text-white"
                        type="button"
                        onClick={clearObservation}
                    >
                        🗑 ล้างฟอร์ม
                    </button>
                    {tried && hasMissing && (
                        <span className="text-sm text-red-500">กรุณากรอกช่องที่มีกรอบสีแดงให้ครบ</span>
                    )}
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
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="font-bold text-emerald-700">ค้นหาข้อมูลบุคลากร</h2>
                            <button
                                type="button"
                                aria-label="ปิดหน้าต่างค้นหา"
                                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                onClick={() => setShowSearch(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="mb-3 flex gap-2">
                            <input
                                className={`w-full ${fieldCls()}`}
                                placeholder="ค้นหาจากชื่อ"
                                value={kw}
                                onChange={(e) => setKw(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && searchPersonnel()}
                                autoFocus
                            />
                            <button className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700" onClick={searchPersonnel}>
                                ค้นหา
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
                                        <tr key={p.cid} className="cursor-pointer transition hover:bg-emerald-50" onClick={() => { setPerson(p); setShowSearch(false); }}>
                                            <td className="border border-slate-200 px-3 py-2">{i + 1}</td>
                                            <td className="border border-slate-200 px-3 py-2">{p.full_name}</td>
                                            <td className="border border-slate-200 px-3 py-2">{p.position || "-"}</td>
                                            <td className="border border-slate-200 px-3 py-2">{p.unit_name || "-"}</td>
                                        </tr>
                                    ))}
                                    {results.length === 0 && (
                                        <tr><td colSpan={4} className="border border-slate-200 px-3 py-4 text-center text-slate-400">พิมพ์ชื่อแล้วกดค้นหา</td></tr>
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
