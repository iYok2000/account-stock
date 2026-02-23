"use client";

import { Store, Plus } from "lucide-react";

export default function ShopsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">ร้านค้า / ช่องทางจำหน่าย</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            จัดการช่องทางการขายและแหล่งสินค้าของคุณ
          </p>
        </div>
        <button className="btn-secondary flex items-center gap-2" disabled>
          <Plus className="h-4 w-4" />
          เพิ่มช่องทาง
        </button>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
        <span>⏳</span>
        <span>
          รอต่อ API — ข้อมูลร้านค้าและยอดขายจริงจะแสดงเมื่อเชื่อมต่อ backend
        </span>
      </div>

      <div className="card text-center py-12 text-muted-foreground">
        <p className="font-medium text-foreground">ไม่มีข้อมูลร้านค้า / ช่องทาง</p>
        <p className="text-sm mt-1">รอต่อ API — รายการร้านค้าและช่องทางจะแสดงเมื่อเชื่อมต่อ backend</p>
      </div>

      <div className="card border-primary/20 bg-primary/5">
        <div className="flex items-start gap-3">
          <Store className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-foreground">การเชื่อมต่อช่องทางจำหน่าย</p>
            <p className="text-sm text-muted-foreground mt-1">
              เมื่อ backend พร้อม สามารถเชื่อมต่อ Shopee, Lazada, LINE OA, TikTok Shop
              หรือช่องทางอื่นๆ ได้ ข้อมูลสต็อกและคำสั่งซื้อจะ sync อัตโนมัติ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
