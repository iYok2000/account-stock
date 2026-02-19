"use client";

import { useState } from "react";
import { User, Shield, Bell, Globe, Store, Plus, Loader2 } from "lucide-react";

const NOTIFICATION_ITEMS = [
  "แจ้งเตือนคำสั่งซื้อใหม่",
  "แจ้งเตือนเมื่อสต็อกต่ำกว่าเป้า",
  "สรุปรายวัน",
  "แจ้งเตือนภาษี",
];

export default function SettingsPage() {
  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_ITEMS.map((k) => [k, true]))
  );

  const toggleNotification = (key: string) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">ตั้งค่า</h2>
        <p className="text-sm text-muted-foreground mt-0.5">จัดการบัญชีและการตั้งค่าระบบ</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-5xl">
        {/* Shop/Brand section — API */}
        <div className="card md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2 text-foreground">
                <Store className="h-5 w-5" />
                ร้านค้า / แบรนด์
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">จัดการร้านค้าและช่องทางจำหน่าย</p>
            </div>
            <button className="btn-secondary flex items-center gap-2 text-sm" disabled>
              <Plus className="h-4 w-4" />
              เพิ่มร้านค้า
            </button>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
            <span>⏳</span>
            <span>รอต่อ API — การจัดการร้านค้าจะใช้งานได้เมื่อเชื่อมต่อ backend</span>
          </div>
          <div className="mt-4 text-center py-8 text-muted-foreground border rounded-lg">
            <Store className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">ยังไม่มีร้านค้า — รอต่อ API</p>
          </div>
        </div>

        {/* Profile */}
        <div className="card space-y-4">
          <div className="mb-2">
            <h3 className="font-semibold flex items-center gap-2 text-foreground">
              <User className="h-5 w-5" />
              ข้อมูลส่วนตัว
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">จัดการข้อมูลบัญชีของคุณ</p>
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-center gap-2">
            <span>⏳</span>
            <span>รอต่อ API — ข้อมูลผู้ใช้จะดึงจาก backend</span>
          </div>

          <div className="space-y-3">
            {[
              { label: "ชื่อที่แสดง", type: "text", placeholder: "ชื่อผู้ใช้" },
              { label: "อีเมล", type: "email", placeholder: "email@example.com" },
              { label: "เบอร์โทร", type: "tel", placeholder: "08x-xxx-xxxx" },
            ].map(({ label, type, placeholder }) => (
              <div key={label}>
                <label className="text-sm font-medium text-foreground">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  disabled
                  className="input-base mt-1 w-full h-10 opacity-60 cursor-not-allowed"
                />
              </div>
            ))}
            <div>
              <label className="text-sm font-medium text-foreground">ประเภทธุรกิจ</label>
              <select
                disabled
                className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm opacity-60 cursor-not-allowed"
              >
                <option value="INDIVIDUAL">บุคคลธรรมดา</option>
                <option value="PARTNERSHIP">ห้างหุ้นส่วน</option>
                <option value="COMPANY">บริษัท</option>
              </select>
            </div>
          </div>
          <button className="btn-primary" disabled>บันทึกข้อมูล</button>
        </div>

        {/* Tax settings */}
        <div className="card space-y-4">
          <div className="mb-2">
            <h3 className="font-semibold flex items-center gap-2 text-foreground">
              <Shield className="h-5 w-5" />
              ตั้งค่าภาษี
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">กำหนดข้อมูลภาษีสำหรับการคำนวณ</p>
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-center gap-2">
            <span>⏳</span>
            <span>รอต่อ API</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground">เลขประจำตัวผู้เสียภาษี</label>
              <input
                type="text"
                placeholder="x-xxxx-xxxxx-xx-x"
                disabled
                className="input-base mt-1 w-full h-10 opacity-60 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">จด VAT</label>
              <select
                disabled
                className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm opacity-60 cursor-not-allowed"
              >
                <option value="no">ไม่ได้จด VAT</option>
                <option value="yes">จด VAT แล้ว</option>
              </select>
            </div>
          </div>
          <button className="btn-primary" disabled>บันทึกข้อมูลภาษี</button>
        </div>

        {/* Notifications */}
        <div className="card space-y-3">
          <div className="mb-2">
            <h3 className="font-semibold flex items-center gap-2 text-foreground">
              <Bell className="h-5 w-5" />
              การแจ้งเตือน
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">ตั้งค่าการแจ้งเตือน</p>
          </div>
          {NOTIFICATION_ITEMS.map((item) => (
            <label
              key={item}
              className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 cursor-pointer"
            >
              <span className="text-sm text-foreground">{item}</span>
              <input
                type="checkbox"
                checked={notifications[item]}
                onChange={() => toggleNotification(item)}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
            </label>
          ))}
        </div>

        {/* Language */}
        <div className="card space-y-3">
          <div className="mb-2">
            <h3 className="font-semibold flex items-center gap-2 text-foreground">
              <Globe className="h-5 w-5" />
              ภาษา / Language
            </h3>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">ภาษาที่แสดง</label>
            <select className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
              <option value="th">ภาษาไทย</option>
              <option value="en">English</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            เปลี่ยนภาษาผ่าน URL เช่น /th/... หรือ /en/... ก็ได้เช่นกัน
          </p>
        </div>
      </div>
    </div>
  );
}
