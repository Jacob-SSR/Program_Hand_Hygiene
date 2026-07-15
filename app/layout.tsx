import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "Hand Hygiene | ระบบบันทึกการสังเกตการทำความสะอาดมือ",
  description: "ระบบบันทึกข้อมูลการสังเกตการทำความสะอาดมือ งานป้องกันและควบคุมการติดเชื้อ (IC) โรงพยาบาลพลับพลาชัย",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}