"use client";

import { Store, Plus, Package, ShoppingCart, TrendingUp } from "lucide-react";

const DEMO_SHOPS = [
  {
    id: "1",
    shopName: "ร้านสินค้าหลัก",
    channel: "Shopee",
    status: "ACTIVE",
    totalProducts: 45,
    totalOrders: 534,
    monthlyRevenue: 245800,
  },
  {
    id: "2",
    shopName: "ช่องทาง Lazada",
    channel: "Lazada",
    status: "ACTIVE",
    totalProducts: 30,
    totalOrders: 310,
    monthlyRevenue: 128500,
  },
  {
    id: "3",
    shopName: "ร้านค้าหน้าเว็บ",
    channel: "LINE OA",
    status: "INACTIVE",
    totalProducts: 20,
    totalOrders: 89,
    monthlyRevenue: 44200,
  },
];

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:
    "inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700",
  INACTIVE:
    "inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
};

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
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            เพิ่มช่องทาง
          </button>
        </div>
      </div>

      {/* API Placeholder Banner */}
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
        <span>⏳</span>
        <span>
          รอต่อ API — ข้อมูลร้านค้าและยอดขายจริงจะแสดงเมื่อเชื่อมต่อ backend
        </span>
      </div>

      {/* Shop Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DEMO_SHOPS.map((shop) => (
          <div
            key={shop.id}
            className="card card-hover cursor-pointer"
          >
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{shop.shopName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {shop.channel}
                  </span>
                  <span className={STATUS_STYLES[shop.status]}>
                    {shop.status === "ACTIVE" ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Package className="h-3.5 w-3.5" />
                </div>
                <p className="text-xl font-bold text-foreground">{shop.totalProducts}</p>
                <p className="text-xs text-muted-foreground">สินค้า</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <ShoppingCart className="h-3.5 w-3.5" />
                </div>
                <p className="text-xl font-bold text-foreground">
                  {shop.totalOrders.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">คำสั่งซื้อ</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                </div>
                <p className="text-xl font-bold text-foreground">
                  {(shop.monthlyRevenue / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-muted-foreground">รายรับ/เดือน</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info card */}
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
