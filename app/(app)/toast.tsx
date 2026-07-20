"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastType = "success" | "error";
type ToastItem = { id: number; type: ToastType; text: string; leaving: boolean };

const ToastContext = createContext<(type: ToastType, text: string) => void>(() => {});

// เรียกใช้จากหน้าไหนก็ได้ที่อยู่ใต้ <ToastProvider>:
//   const toast = useToast();
//   toast("success", "บันทึกข้อมูลสำเร็จ");
export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const nextId = useRef(0);

    const dismiss = useCallback((id: number) => {
        // เล่นอนิเมชันเลื่อนออกให้จบก่อน แล้วค่อยถอดออกจากรายการ
        setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
        setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 300);
    }, []);

    const push = useCallback((type: ToastType, text: string) => {
        const id = ++nextId.current;
        setToasts((ts) => [...ts, { id, type, text, leaving: false }]);
        setTimeout(() => dismiss(id), 4500);
    }, [dismiss]);

    return (
        <ToastContext.Provider value={push}>
            {children}

            {/* กองโชว์ toast มุมขวาบน ใต้ topbar */}
            <div aria-live="polite" className="pointer-events-none fixed right-4 top-16 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        role="status"
                        className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-lg ${t.leaving ? "animate-toast-out" : "animate-toast-in"} ${
                            t.type === "success"
                                ? "border-green-200 bg-green-50 text-green-800"
                                : "border-red-200 bg-red-50 text-red-700"
                        }`}
                    >
                        <span
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                                t.type === "success" ? "bg-green-500" : "bg-red-500"
                            }`}
                        >
                            {t.type === "success" ? "✓" : "!"}
                        </span>
                        <p className="flex-1 pt-0.5 text-sm font-medium leading-snug">{t.text}</p>
                        <button
                            type="button"
                            aria-label="ปิดการแจ้งเตือน"
                            className="rounded-md p-1 text-slate-400 transition hover:bg-black/5 hover:text-slate-600"
                            onClick={() => dismiss(t.id)}
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
