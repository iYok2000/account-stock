"use client";

import { useState, useMemo } from "react";
import { Ticket, Plus, X, Trash2, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { FieldError } from "@/components/ui/field-error";
import { Slider } from "@/components/ui/Slider";
import { formatCurrency } from "@/lib/utils";

// Voucher type labels (Thai)
type VoucherType = "SHOP" | "CO_FUNDED" | "PLATFORM";
const VOUCHER_TYPE_LABELS: Record<VoucherType, string> = {
  SHOP: "ร้านค้า",
  CO_FUNDED: "ร่วมจ่าย",
  PLATFORM: "แพลตฟอร์ม",
};

const VOUCHER_TYPE_COLORS: Record<VoucherType, string> = {
  SHOP: "#059669",
  CO_FUNDED: "#F59E0B",
  PLATFORM: "#8856A8",
};

const COMMISSION_FEE_RATE = 0.04;
const PAYMENT_FEE_RATE = 0.02;
const COMMISSION_VAT_RATE = 0.07;

interface Voucher {
  id: string;
  name: string;
  voucherType: VoucherType;
  discountAmount: number | null;
  discountPercent: number | null;
  sellerSharePercent: number;
  platformSharePercent: number;
  minPurchaseBaht: number | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

interface AddFormData {
  name: string;
  voucherType: VoucherType;
  discountType: "fixed" | "percent";
  discountAmount: string;
  discountPercent: string;
  sellerSharePercent: string;
  minPurchaseBaht: string;
  startDate: string;
  endDate: string;
}

// Demo vouchers
const DEMO_VOUCHERS: Voucher[] = [
  {
    id: "1",
    name: "SAVE50",
    voucherType: "CO_FUNDED",
    discountAmount: 50,
    discountPercent: null,
    sellerSharePercent: 40,
    platformSharePercent: 60,
    minPurchaseBaht: 299,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    isActive: true,
  },
  {
    id: "2",
    name: "FLASH100",
    voucherType: "SHOP",
    discountAmount: 100,
    discountPercent: null,
    sellerSharePercent: 100,
    platformSharePercent: 0,
    minPurchaseBaht: 500,
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    isActive: true,
  },
];

function calculateVoucherImpact(p: {
  sellingPrice: number; productCost: number; shippingCost: number;
  totalOrdersPerMonth: number; adSpendPerMonth: number;
  discountAmount: number; sellerSharePercent: number;
  minPurchase: number; voucherUsageRate: number;
}) {
  const { sellingPrice, productCost, shippingCost, totalOrdersPerMonth, adSpendPerMonth,
    discountAmount, sellerSharePercent, voucherUsageRate } = p;
  const platformSharePercent = 100 - sellerSharePercent;
  const ordersWithVoucher = Math.round(totalOrdersPerMonth * (voucherUsageRate / 100));
  const ordersWithoutVoucher = totalOrdersPerMonth - ordersWithVoucher;
  const sellerCostPerVoucher = discountAmount * (sellerSharePercent / 100);
  const platformSubsidy = discountAmount * (platformSharePercent / 100);
  const commissionPerOrder = sellingPrice * COMMISSION_FEE_RATE;
  const commissionVat = commissionPerOrder * COMMISSION_VAT_RATE;
  const paymentFeePerOrder = sellingPrice * PAYMENT_FEE_RATE;
  const platformFeesPerOrder = commissionPerOrder + commissionVat + paymentFeePerOrder;
  const baseProfitPerOrder = sellingPrice - productCost - shippingCost - platformFeesPerOrder;
  const baseMonthlyRevenue = sellingPrice * totalOrdersPerMonth;
  const baseMonthlyProfit = baseProfitPerOrder * totalOrdersPerMonth - adSpendPerMonth;
  const baseRoas = adSpendPerMonth > 0 ? baseMonthlyRevenue / adSpendPerMonth : 0;
  const voucherProfitPerOrder = baseProfitPerOrder - sellerCostPerVoucher;
  const normalProfitTotal = baseProfitPerOrder * ordersWithoutVoucher;
  const voucherProfitTotal = voucherProfitPerOrder * ordersWithVoucher;
  const totalVoucherCost = sellerCostPerVoucher * ordersWithVoucher;
  const voucherMonthlyProfit = normalProfitTotal + voucherProfitTotal - adSpendPerMonth;
  const voucherMonthlyRevenue = baseMonthlyRevenue;
  const voucherRoas = (adSpendPerMonth + totalVoucherCost) > 0
    ? voucherMonthlyRevenue / (adSpendPerMonth + totalVoucherCost) : 0;
  const profitDelta = voucherMonthlyProfit - baseMonthlyProfit;
  const roasDelta = voucherRoas - baseRoas;
  const breakEvenExtraOrders = baseProfitPerOrder > 0
    ? Math.ceil(totalVoucherCost / baseProfitPerOrder) : 0;
  const usageRateChartData = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((rate) => {
    const ov = Math.round(totalOrdersPerMonth * (rate / 100));
    const profit = baseProfitPerOrder * totalOrdersPerMonth - sellerCostPerVoucher * ov - adSpendPerMonth;
    return { rate, profit: Math.round(profit) };
  });
  return {
    sellerCostPerVoucher, platformSubsidy, platformSharePercent,
    ordersWithVoucher, ordersWithoutVoucher, totalVoucherCost,
    baseProfitPerOrder, baseMonthlyRevenue, baseMonthlyProfit, baseRoas,
    voucherProfitPerOrder, voucherMonthlyProfit, voucherMonthlyRevenue, voucherRoas,
    profitDelta, roasDelta, breakEvenExtraOrders, usageRateChartData,
  };
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors touch-target-min"
      >
        <div className="flex items-center gap-2 font-medium">
          {icon}
          {title}
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
}

export default function VouchersPage() {
  // Voucher management state
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [vouchers, setVouchers] = useState<Voucher[]>(DEMO_VOUCHERS);

  const [formData, setFormData] = useState<AddFormData>({
    name: "",
    voucherType: "CO_FUNDED",
    discountType: "fixed",
    discountAmount: "",
    discountPercent: "",
    sellerSharePercent: "40",
    minPurchaseBaht: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  // Calculator state
  const [sellingPrice, setSellingPrice] = useState(499);
  const [productCost, setProductCost] = useState(200);
  const [shippingCost, setShippingCost] = useState(40);
  const [totalOrders, setTotalOrders] = useState(500);
  const [adSpend, setAdSpend] = useState(10_000);
  const [discountAmountCalc, setDiscountAmountCalc] = useState(30);
  const [sellerShare, setSellerShare] = useState(40);
  const [minPurchase, setMinPurchase] = useState(300);
  const [usageRate, setUsageRate] = useState(30);

  const result = useMemo(() => calculateVoucherImpact({
    sellingPrice, productCost, shippingCost,
    totalOrdersPerMonth: totalOrders, adSpendPerMonth: adSpend,
    discountAmount: discountAmountCalc, sellerSharePercent: sellerShare,
    minPurchase, voucherUsageRate: usageRate,
  }), [sellingPrice, productCost, shippingCost, totalOrders, adSpend, discountAmountCalc, sellerShare, minPurchase, usageRate]);

  const profitImpactColor = result.profitDelta >= 0 ? "text-green-600" : "text-red-600";
  const maxProfit = Math.max(...result.usageRateChartData.map((d) => Math.abs(d.profit)));

  const activeVouchers = vouchers.filter((v) => v.isActive);
  const inactiveVouchers = vouchers.filter((v) => !v.isActive);

  // Stats for Simple Stats Cards
  const stats = [
    { label: "โค้ดที่ใช้งาน", value: activeVouchers.length, color: "bg-green-50 border-green-200 text-green-700" },
    { label: "โค้ดที่ปิด", value: inactiveVouchers.length, color: "bg-neutral-100 border-neutral-200 text-neutral-600" },
    { label: "รวมโค้ด", value: vouchers.length, color: "bg-blue-50 border-blue-200 text-blue-700" },
  ];

  // Add voucher
  const handleAddVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const discountAmt = parseFloat(formData.discountAmount);
    const discountPct = parseFloat(formData.discountPercent);
    const sellerShareVal = parseFloat(formData.sellerSharePercent);
    const minPurchaseVal = parseFloat(formData.minPurchaseBaht);

    if (!formData.name) {
      setFormErrors({ name: "กรุณากรอกชื่อโค้ดส่วนลด" });
      return;
    }

    const newVoucher: Voucher = {
      id: Date.now().toString(),
      name: formData.name,
      voucherType: formData.voucherType,
      discountAmount: formData.discountType === "fixed" ? discountAmt : null,
      discountPercent: formData.discountType === "percent" ? discountPct : null,
      sellerSharePercent: isNaN(sellerShareVal) ? 100 : sellerShareVal,
      platformSharePercent: isNaN(sellerShareVal) ? 0 : 100 - sellerShareVal,
      minPurchaseBaht: isNaN(minPurchaseVal) ? null : minPurchaseVal,
      startDate: formData.startDate,
      endDate: formData.endDate || null,
      isActive: true,
    };

    setVouchers([...vouchers, newVoucher]);
    setFormData({
      name: "",
      voucherType: "CO_FUNDED",
      discountType: "fixed",
      discountAmount: "",
      discountPercent: "",
      sellerSharePercent: "40",
      minPurchaseBaht: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
    });
    setShowAddForm(false);
  };

  // Delete voucher
  const handleConfirmDelete = (id: string) => {
    setVouchers(vouchers.filter((v) => v.id !== id));
    setDeleteConfirmId(null);
  };

  // Toggle voucher active
  const handleToggleActive = (id: string) => {
    setVouchers(vouchers.map((v) => v.id === id ? { ...v, isActive: !v.isActive } : v));
  };

  // Render voucher card
  const renderVoucherCard = (voucher: Voucher, muted = false) => {
    const isDeleting = deleteConfirmId === voucher.id;
    const discountDisplay = voucher.discountAmount
      ? `฿${voucher.discountAmount.toLocaleString()}`
      : voucher.discountPercent
        ? `${voucher.discountPercent}%`
        : "-";

    return (
      <Card key={voucher.id} className={`relative ${muted ? "opacity-60" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <CardTitle className="text-base">{voucher.name}</CardTitle>
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: VOUCHER_TYPE_COLORS[voucher.voucherType], color: VOUCHER_TYPE_COLORS[voucher.voucherType] }}
                >
                  {VOUCHER_TYPE_LABELS[voucher.voucherType]}
                </Badge>
                <Badge variant={voucher.isActive ? "success" : "secondary"} className="text-xs">
                  {voucher.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">ส่วนลด:</span>
            <span className="text-2xl font-bold">{discountDisplay}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            ร้าน {voucher.sellerSharePercent}% / แพลตฟอร์ม {voucher.platformSharePercent}%
          </div>
          {voucher.minPurchaseBaht != null && voucher.minPurchaseBaht > 0 && (
            <div className="text-xs text-muted-foreground">
              ยอดขั้นต่ำ ฿{voucher.minPurchaseBaht.toLocaleString()}
            </div>
          )}
          {(voucher.startDate || voucher.endDate) && (
            <div className="text-xs text-muted-foreground">
              {voucher.startDate && <span>{new Date(voucher.startDate).toLocaleDateString("th-TH")}</span>}
              {voucher.startDate && voucher.endDate && <span> - </span>}
              {voucher.endDate && <span>{new Date(voucher.endDate).toLocaleDateString("th-TH")}</span>}
            </div>
          )}
          <div className="flex items-center gap-3 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Switch checked={voucher.isActive} onCheckedChange={() => handleToggleActive(voucher.id)} />
              <span className="text-sm">{voucher.isActive ? "เปิด" : "ปิด"}</span>
            </div>
            {isDeleting ? (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs">ลบ?</span>
                <Button size="sm" variant="destructive" onClick={() => handleConfirmDelete(voucher.id)} className="touch-target-min">
                  ลบ
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(null)} className="touch-target-min">
                  ยกเลิก
                </Button>
              </div>
            ) : (
              <Button
                size="sm" variant="ghost"
                onClick={() => setDeleteConfirmId(voucher.id)}
                className="ml-auto text-red-500 touch-target-min"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                ลบ
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">โค้ดส่วนลด</h2>
          <p className="text-sm text-muted-foreground">
            จัดการโค้ดส่วนลดและคำนวณผลกระทบ
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="touch-target-min">
          {showAddForm ? (<><X className="h-4 w-4 mr-1" />ยกเลิก</>) : (<><Plus className="h-4 w-4 mr-1" />เพิ่มโค้ด</>)}
        </Button>
      </div>

      {/* Simple Stats Cards - Mobile First */}
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`p-3 rounded-lg border text-center ${stat.color}`}
          >
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">เพิ่มโค้ดส่วนลดใหม่</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddVoucher} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">ชื่อโค้ด</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="เช่น SAVE50" className="mt-1 w-full h-11 rounded-md border border-neutral-300 px-3 text-sm touch-target-min" required />
                  <FieldError message={formErrors.name} />
                </div>
                <div>
                  <label className="text-sm font-medium">ประเภท</label>
                  <select value={formData.voucherType} onChange={(e) => setFormData({ ...formData, voucherType: e.target.value as VoucherType })}
                    className="mt-1 w-full h-11 rounded-md border border-neutral-300 px-3 text-sm touch-target-min">
                    <option value="SHOP">ร้านค้า</option>
                    <option value="CO_FUNDED">ร่วมจ่าย</option>
                    <option value="PLATFORM">แพลตฟอร์ม</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">ส่วนลด</label>
                  <input type="number" value={formData.discountAmount} onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                    placeholder="50" min="0" className="mt-1 w-full h-11 rounded-md border border-neutral-300 px-3 text-sm touch-target-min" />
                </div>
                <div>
                  <label className="text-sm font-medium">ส่วนผู้ขาย (%)</label>
                  <input type="number" value={formData.sellerSharePercent} onChange={(e) => setFormData({ ...formData, sellerSharePercent: e.target.value })}
                    min="0" max="100" className="mt-1 w-full h-11 rounded-md border border-neutral-300 px-3 text-sm touch-target-min" />
                </div>
                <div>
                  <label className="text-sm font-medium">ขั้นต่ำ (฿)</label>
                  <input type="number" value={formData.minPurchaseBaht} onChange={(e) => setFormData({ ...formData, minPurchaseBaht: e.target.value })}
                    placeholder="0" min="0" className="mt-1 w-full h-11 rounded-md border border-neutral-300 px-3 text-sm touch-target-min" />
                </div>
                <div>
                  <label className="text-sm font-medium">วันที่เริ่ม</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="mt-1 w-full h-11 rounded-md border border-neutral-300 px-3 text-sm touch-target-min" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="touch-target-min">
                  <Plus className="h-4 w-4 mr-1" />เพิ่ม
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="touch-target-min">ยกเลิก</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active Vouchers */}
      <div className="space-y-3">
        <h3 className="font-semibold">โค้ดที่ใช้งาน ({activeVouchers.length})</h3>
        {activeVouchers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>ยังไม่มีโค้ดส่วนลด</p>
              <p className="text-xs mt-1">กด "เพิ่มโค้ด" เพื่อเริ่มต้น</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">{activeVouchers.map((v) => renderVoucherCard(v))}</div>
        )}
      </div>

      {/* Inactive Vouchers */}
      {inactiveVouchers.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">โค้ดที่ปิด ({inactiveVouchers.length})</h3>
          <div className="grid gap-3 sm:grid-cols-2">{inactiveVouchers.map((v) => renderVoucherCard(v, true))}</div>
        </div>
      )}

      {/* Calculator - Collapsible */}
      <CollapsibleSection
        title="เครื่องมือคำนวณผลกระทบ"
        icon={<Ticket className="h-5 w-5" />}
        defaultOpen={false}
      >
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-3 rounded-lg border bg-neutral-50">
            <p className="text-xs text-muted-foreground">กำไร/เดือน (ไม่มีโค้ด)</p>
            <p className="text-lg font-bold">{formatCurrency(result.baseMonthlyProfit)}</p>
          </div>
          <div className="p-3 rounded-lg border bg-neutral-50">
            <p className="text-xs text-muted-foreground">กำไร/เดือน (มีโค้ด)</p>
            <p className="text-lg font-bold">{formatCurrency(result.voucherMonthlyProfit)}</p>
          </div>
          <div className="p-3 rounded-lg border bg-neutral-50">
            <p className="text-xs text-muted-foreground">ต้นทุนโค้ดรวม</p>
            <p className="text-lg font-bold text-red-600">-{formatCurrency(result.totalVoucherCost)}</p>
          </div>
          <div className={`p-3 rounded-lg border ${result.profitDelta >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <p className="text-xs text-muted-foreground">ผลกระทบ</p>
            <p className={`text-lg font-bold ${profitImpactColor}`}>
              {result.profitDelta >= 0 ? "+" : ""}{formatCurrency(result.profitDelta)}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Voucher config */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">ตั้งค่าโค้ด</h4>
            <Slider label="ส่วนลด (฿)" value={discountAmountCalc} onChange={setDiscountAmountCalc} min={5} max={200} step={5} prefix="฿" />
            <Slider label="ส่วนผู้ขาย (%)" value={sellerShare} onChange={setSellerShare} min={0} max={100} step={5} suffix="%" />
            <div className="text-xs text-muted-foreground bg-neutral-50 p-2 rounded">
              ผู้ขายออก: {formatCurrency(result.sellerCostPerVoucher)} ({sellerShare}%) | แพลตฟอร์มออก: {formatCurrency(result.platformSubsidy)} ({result.platformSharePercent}%)
            </div>
            <Slider label="ยอดขั้นต่ำ (฿)" value={minPurchase} onChange={setMinPurchase} min={0} max={2_000} step={50} prefix="฿" />
            <Slider label="อัตราใช้โค้ด (%)" value={usageRate} onChange={setUsageRate} min={0} max={100} step={5} suffix="%" />
          </div>

          {/* Business params */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">ข้อมูลธุรกิจ</h4>
            <Slider label="ราคาขาย (฿)" value={sellingPrice} onChange={setSellingPrice} min={50} max={5_000} step={10} prefix="฿" />
            <Slider label="ต้นทุนสินค้า (฿)" value={productCost} onChange={setProductCost} min={0} max={3_000} step={10} prefix="฿" />
            <Slider label="ค่าจัดส่ง (฿)" value={shippingCost} onChange={setShippingCost} min={0} max={200} step={5} prefix="฿" />
            <Slider label="ออเดอร์/เดือน" value={totalOrders} onChange={setTotalOrders} min={10} max={10_000} step={10} suffix=" ออเดอร์" />
            <Slider label="ค่าโฆษณา/เดือน (฿)" value={adSpend} onChange={setAdSpend} min={0} max={100_000} step={1_000} prefix="฿" />
          </div>

          {/* Break-even */}
          {result.breakEvenExtraOrders > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-800">
                ต้องขายเพิ่ม <strong>{result.breakEvenExtraOrders} ออเดอร์</strong> เพื่อชดเชยต้นทุนโค้ด
              </p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Reference Info */}
      <CollapsibleSection
        title="ประเภทโค้ดส่วนลด TikTok Shop"
        icon={<Info className="h-5 w-5" />}
        defaultOpen={false}
      >
        <div className="grid gap-3 text-sm">
          <div>
            <p className="font-medium">ร้านค้า</p>
            <p className="text-xs text-muted-foreground">ร้านออกส่วนลดเอง 100%</p>
          </div>
          <div>
            <p className="font-medium">ร่วมจ่าย</p>
            <p className="text-xs text-muted-foreground">ร้าน + แพลตฟอร์ม ออกด้วยกัน</p>
          </div>
          <div>
            <p className="font-medium">แพลตฟอร์ม</p>
            <p className="text-xs text-muted-foreground">TikTok ออกให้ทั้งหมด</p>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
