"use client";

import { useState, useMemo } from "react";
import { Ticket, AlertTriangle } from "lucide-react";
import { Slider } from "@/components/ui/Slider";
import { formatCurrency } from "@/lib/utils";

const COMMISSION_FEE_RATE = 0.04;
const PAYMENT_FEE_RATE = 0.02;
const COMMISSION_VAT_RATE = 0.07;

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

export default function VouchersPage() {
  const [sellingPrice, setSellingPrice] = useState(499);
  const [productCost, setProductCost] = useState(200);
  const [shippingCost, setShippingCost] = useState(40);
  const [totalOrders, setTotalOrders] = useState(500);
  const [adSpend, setAdSpend] = useState(10_000);
  const [discountAmount, setDiscountAmount] = useState(30);
  const [sellerShare, setSellerShare] = useState(40);
  const [minPurchase, setMinPurchase] = useState(300);
  const [usageRate, setUsageRate] = useState(30);

  const result = useMemo(() => calculateVoucherImpact({
    sellingPrice, productCost, shippingCost,
    totalOrdersPerMonth: totalOrders, adSpendPerMonth: adSpend,
    discountAmount, sellerSharePercent: sellerShare,
    minPurchase, voucherUsageRate: usageRate,
  }), [sellingPrice, productCost, shippingCost, totalOrders, adSpend, discountAmount, sellerShare, minPurchase, usageRate]);

  const profitImpactColor = result.profitDelta >= 0 ? "text-green-600" : "text-red-600";
  const maxProfit = Math.max(...result.usageRateChartData.map((d) => Math.abs(d.profit)));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Voucher Impact Calculator</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          คำนวณผลกระทบของโค้ดส่วนลด Co-funded ต่อกำไรและ ROAS
        </p>
      </div>

      {/* Saved vouchers — API placeholder */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2 text-foreground">
              <Ticket className="h-5 w-5" />
              โค้ดส่วนลดที่บันทึกไว้
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">จัดการโค้ดส่วนลดทั้งหมด</p>
          </div>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
          <span>⏳</span>
          <span>รอต่อ API — การบันทึก/ดึงโค้ดส่วนลดจะใช้งานได้เมื่อเชื่อมต่อ backend</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { title: "กำไร/เดือน (ไม่มีโค้ด)", value: formatCurrency(result.baseMonthlyProfit) },
          { title: "กำไร/เดือน (มีโค้ด)", value: formatCurrency(result.voucherMonthlyProfit) },
          { title: "ต้นทุนโค้ดรวม", value: formatCurrency(result.totalVoucherCost) },
          {
            title: "ผลกระทบ",
            value: `${result.profitDelta >= 0 ? "+" : ""}${formatCurrency(result.profitDelta)}`,
            cls: profitImpactColor,
          },
        ].map(({ title, value, cls }) => (
          <div key={title} className="card">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={`text-xl font-bold mt-1 ${cls ?? "text-foreground"}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: sliders */}
        <div className="space-y-4">
          {/* Voucher config */}
          <div className="card space-y-5">
            <div>
              <h3 className="font-semibold flex items-center gap-2 text-foreground">
                <Ticket className="h-5 w-5" />ตั้งค่าโค้ดส่วนลด
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">กำหนดเงื่อนไขโค้ด Co-funded</p>
            </div>
            <Slider label="ส่วนลด (THB ต่อออเดอร์)" value={discountAmount} onChange={setDiscountAmount} min={5} max={200} step={5} prefix="฿" />
            <Slider label="ส่วนที่ผู้ขายออก" value={sellerShare} onChange={setSellerShare} min={0} max={100} step={5} suffix="%" />
            <div className="rounded-md bg-muted/50 p-3 space-y-1 text-xs">
              <p className="font-medium text-foreground">สรุปโค้ด</p>
              <p className="text-muted-foreground">ลด {formatCurrency(discountAmount)} เมื่อซื้อครบ {formatCurrency(minPurchase)}</p>
              <div className="flex gap-4">
                <span className="text-red-600">ผู้ขายออก: {formatCurrency(result.sellerCostPerVoucher)} ({sellerShare}%)</span>
                <span className="text-primary">แพลตฟอร์มออก: {formatCurrency(result.platformSubsidy)} ({result.platformSharePercent}%)</span>
              </div>
            </div>
            <Slider label="ยอดสั่งซื้อขั้นต่ำ" value={minPurchase} onChange={setMinPurchase} min={0} max={2_000} step={50} prefix="฿" />
            <Slider label="อัตราการใช้โค้ด" value={usageRate} onChange={setUsageRate} min={0} max={100} step={5} suffix="%" />
            <p className="text-xs text-muted-foreground">
              ออเดอร์ที่ใช้โค้ด: {result.ordersWithVoucher.toLocaleString()} จาก {totalOrders.toLocaleString()} ออเดอร์
            </p>
          </div>

          {/* Business params */}
          <div className="card space-y-5">
            <div>
              <h3 className="font-semibold text-foreground">ข้อมูลธุรกิจ</h3>
              <p className="text-sm text-muted-foreground mt-0.5">ปรับค่าให้ตรงกับสินค้าของคุณ</p>
            </div>
            <Slider label="ราคาขาย" value={sellingPrice} onChange={setSellingPrice} min={50} max={5_000} step={10} prefix="฿" />
            <Slider label="ต้นทุนสินค้า" value={productCost} onChange={setProductCost} min={0} max={3_000} step={10} prefix="฿" />
            <Slider label="ค่าจัดส่ง" value={shippingCost} onChange={setShippingCost} min={0} max={200} step={5} prefix="฿" />
            <Slider label="ออเดอร์ต่อเดือน" value={totalOrders} onChange={setTotalOrders} min={10} max={10_000} step={10} suffix=" ออเดอร์" />
            <Slider label="ค่าโฆษณาต่อเดือน" value={adSpend} onChange={setAdSpend} min={0} max={100_000} step={1_000} prefix="฿" />
          </div>
        </div>

        {/* Right: results */}
        <div className="space-y-4">
          {/* Comparison table */}
          <div className="card">
            <h3 className="font-semibold text-foreground mb-3">เปรียบเทียบ: มีโค้ด vs ไม่มีโค้ด</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">รายการ</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">ไม่มีโค้ด</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">มีโค้ด</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">ผลต่าง</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      label: "กำไร/ชิ้น",
                      base: formatCurrency(result.baseProfitPerOrder),
                      voucher: formatCurrency(result.voucherProfitPerOrder),
                      delta: result.voucherProfitPerOrder - result.baseProfitPerOrder,
                    },
                    {
                      label: "กำไร/เดือน",
                      base: formatCurrency(result.baseMonthlyProfit),
                      voucher: formatCurrency(result.voucherMonthlyProfit),
                      delta: result.profitDelta,
                    },
                    {
                      label: "ROAS",
                      base: `${result.baseRoas.toFixed(2)}x`,
                      voucher: `${result.voucherRoas.toFixed(2)}x`,
                      delta: result.roasDelta,
                      isRoas: true,
                    },
                  ].map((row) => (
                    <tr key={row.label} className="border-b">
                      <td className="py-2 px-3">{row.label}</td>
                      <td className="py-2 px-3 text-right">{row.base}</td>
                      <td className="py-2 px-3 text-right">{row.voucher}</td>
                      <td className={`py-2 px-3 text-right font-medium ${row.delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {row.isRoas
                          ? `${row.delta >= 0 ? "+" : ""}${row.delta.toFixed(2)}x`
                          : `${row.delta >= 0 ? "+" : ""}${formatCurrency(row.delta)}`}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b bg-muted/30">
                    <td className="py-2 px-3 font-medium">ต้นทุนโค้ดรวม/เดือน</td>
                    <td className="py-2 px-3 text-right">-</td>
                    <td className="py-2 px-3 text-right text-red-600 font-medium">-{formatCurrency(result.totalVoucherCost)}</td>
                    <td className="py-2 px-3" />
                  </tr>
                </tbody>
              </table>
            </div>
            {result.breakEvenExtraOrders > 0 && (
              <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 p-3">
                <p className="text-sm text-amber-800">
                  ต้องขายเพิ่ม <strong>{result.breakEvenExtraOrders} ออเดอร์</strong> เพื่อชดเชยต้นทุนโค้ด
                </p>
              </div>
            )}
          </div>

          {/* Usage rate chart (simple SVG-free bar) */}
          <div className="card">
            <h3 className="font-semibold text-foreground mb-1">กำไรตามอัตราการใช้โค้ด</h3>
            <p className="text-sm text-muted-foreground mb-4">ดูว่าถ้าลูกค้าใช้โค้ดมากขึ้น กำไรจะเปลี่ยนอย่างไร</p>
            <div className="space-y-1">
              {result.usageRateChartData.map(({ rate, profit }) => {
                const pct = maxProfit > 0 ? (Math.abs(profit) / maxProfit) * 100 : 0;
                const isNeg = profit < 0;
                return (
                  <div key={rate} className="flex items-center gap-2 text-xs">
                    <span className="w-8 text-right text-muted-foreground">{rate}%</span>
                    <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                      <div
                        className={`h-5 rounded transition-all ${isNeg ? "bg-red-400" : "bg-primary"}`}
                        style={{ width: `${Math.max(pct, 1)}%` }}
                      />
                    </div>
                    <span className={`w-24 text-right font-medium ${isNeg ? "text-red-600" : "text-foreground"}`}>
                      {formatCurrency(profit)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tips */}
          <div className="card space-y-2 text-sm">
            <h4 className="font-semibold text-foreground">Tips ใช้โค้ดอย่างชาญฉลาด</h4>
            <p className="text-muted-foreground">• ตั้ง seller share ต่ำ (20–40%) เพื่อให้แพลตฟอร์มช่วยออกมากกว่า</p>
            <p className="text-muted-foreground">• ตั้ง min purchase สูงกว่าราคาสินค้าเฉลี่ยเพื่อเพิ่ม AOV</p>
            <p className="text-muted-foreground">• ติดตามอัตราการใช้โค้ดจริง แล้วกลับมาปรับค่าในเครื่องคำนวณนี้</p>
            {sellerShare > 50 && (
              <p className="text-amber-700 font-medium flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                คุณออกมากกว่า 50% — ลองต่อรองให้แพลตฟอร์มออกส่วนแบ่งเพิ่ม
              </p>
            )}
            {result.voucherMonthlyProfit < 0 && (
              <p className="text-red-600 font-medium flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                กำไรติดลบ! ลองลดส่วนลดหรือลดอัตรา seller share
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
