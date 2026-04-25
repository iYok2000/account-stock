"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Upload,
  BarChart3,
  Store,
  Package,
  AlertTriangle,
  Banknote,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/utils";
import type { AffiliateSummary } from "@/components/upload/file-parser";
import { useUserContext } from "@/contexts/AuthContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";

// Lazy-load recharts — SSR off
const AffiliateTopShopsChart = dynamic(
  () => import("@/components/affiliate/AffiliateCharts").then((m) => m.AffiliateTopShopsChart),
  { ssr: false, loading: () => <div className="h-75 bg-brown-100 animate-pulse rounded-lg" /> }
);
const AffiliateProductsChart = dynamic(
  () => import("@/components/affiliate/AffiliateCharts").then((m) => m.AffiliateProductsChart),
  { ssr: false, loading: () => <div className="h-62 bg-brown-100 animate-pulse rounded-lg" /> }
);

const STORAGE_KEY = "affiliate-dashboard-summary";
const SHOPS_PREVIEW = 5;
const PRODUCTS_PREVIEW = 5;

function ActionableTip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl border border-brown-200 bg-brown-50 text-sm text-brown-800">
      <Lightbulb className="w-4 h-4 text-brown-500 shrink-0 mt-0.5" />
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}

export function AffiliateDashboard() {
  const [summary, setSummary] = useState<AffiliateSummary | null>(null);
  const [showAllShops, setShowAllShops] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const user = useUserContext();
  const router = useRouter();
  const isAffiliateRole = user?.role === "Affiliate";

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setSummary(JSON.parse(raw) as AffiliateSummary);
    } catch {}
  }, []);

  const handleSwitchToSeller = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    router.refresh();
  };

  // ── Derived values ──
  const totalAll = summary?.totalCommission ?? 0;
  const totalEligible = summary?.totalEligibleCommission ?? totalAll;

  const settled = useMemo(
    () =>
      (summary?.byStatus ?? [])
        .filter((s) => s.status.toLowerCase().includes("settled"))
        .reduce((acc, s) => acc + s.amount, 0),
    [summary]
  );
  const pending = useMemo(
    () =>
      (summary?.byStatus ?? [])
        .filter((s) => s.status.toLowerCase().includes("pending"))
        .reduce((acc, s) => acc + s.amount, 0),
    [summary]
  );
  const ineligible = useMemo(
    () =>
      (summary?.byStatus ?? [])
        .filter((s) => s.status.toLowerCase().includes("ineligible"))
        .reduce((acc, s) => acc + s.amount, 0),
    [summary]
  );

  const settledPct = totalAll > 0 ? (settled / totalAll) * 100 : 0;
  const pendingPct = totalAll > 0 ? (pending / totalAll) * 100 : 0;
  const ineligiblePct = totalAll > 0 ? (ineligible / totalAll) * 100 : 0;

  const totalGMV = useMemo(
    () => (summary?.byShop ?? []).reduce((acc, s) => acc + s.gmv, 0),
    [summary]
  );

  const sortedShops = useMemo(
    () => (summary?.byShop ?? []).slice().sort((a, b) => b.amount - a.amount),
    [summary]
  );
  const topShop = sortedShops[0];
  const topShopPct = totalEligible > 0 && topShop ? (topShop.amount / totalEligible) * 100 : 0;

  const sortedProducts = useMemo(
    () => (summary?.products ?? []).slice().sort((a, b) => b.commission - a.commission),
    [summary]
  );
  const topProduct = sortedProducts[0];

  const shopsChartData = useMemo(
    () =>
      sortedShops.slice(0, 6).map((s) => ({
        name: s.shopName.length > 18 ? s.shopName.slice(0, 18) + "\u2026" : s.shopName,
        earned: s.amount,
        gmv: s.gmv,
        ineligibleAmount: s.ineligibleAmount,
      })),
    [sortedShops]
  );

  const productsChartData = useMemo(
    () =>
      sortedProducts.slice(0, 6).map((p) => ({
        name: p.productName.length > 22 ? p.productName.slice(0, 22) + "\u2026" : p.productName,
        commission: p.commission,
      })),
    [sortedProducts]
  );

  // ── Empty state ──
  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4 bg-white rounded-2xl border border-brown-200 max-w-2xl mx-auto shadow-sm">
        <div className="mb-5 rounded-2xl bg-brown-50 p-5 flex items-center justify-center w-20 h-20 border border-brown-100">
          <Banknote className="w-10 h-10 text-brown-400" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-brown-800 mb-2">ยังไม่มีข้อมูลให้วิเคราะห์</h3>
        <p className="text-sm sm:text-base text-brown-500 max-w-md leading-relaxed mb-5">
          นำเข้าไฟล์รายงาน Affiliate ครั้งเดียว แล้วกลับมาดูได้เลยว่าร้านไหนทำเงินจริง และเงินส่วนไหนยังไม่เข้า
        </p>
        <Link href="/import" className="btn-primary flex items-center gap-2">
          <Upload className="h-4 w-4" />
          ไปนำเข้าข้อมูล
        </Link>
      </div>
    );
  }

  const visibleShops = showAllShops ? sortedShops : sortedShops.slice(0, SHOPS_PREVIEW);
  const visibleProducts = showAllProducts ? sortedProducts : sortedProducts.slice(0, PRODUCTS_PREVIEW);

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-brown-800">ภาพรวมรายได้ Affiliate</h2>
          <p className="text-sm text-brown-500">
            ดูทันทีว่าเงินเข้าแล้วเท่าไร ยังมีอะไรค้างจ่าย และควรดันร้านหรือสินค้าตัวไหนต่อ
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isAffiliateRole && (
            <button
              type="button"
              onClick={handleSwitchToSeller}
              className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-brown-300 text-brown-700 bg-white hover:bg-brown-50 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              Seller Dashboard
            </button>
          )}
          <Link
            href="/import"
            className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-brown-300 text-brown-700 bg-white hover:bg-brown-50 transition-colors"
          >
            <Upload className="h-4 w-4" />
            นำเข้าใหม่
          </Link>
        </div>
      </div>

      {/* ── Hero Card (dark brown gradient — same as congrate) ── */}
      <div className="bg-white rounded-xl border border-brown-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-brown-700 to-brown-800 p-5 sm:p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-brown-200 mb-1">คอมมิชชั่นที่ได้รับจริง</p>
              <p className="text-3xl sm:text-4xl font-bold font-mono tracking-tight">
                {formatCurrency(totalEligible)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-brown-300 uppercase tracking-wider">ยอดขายรวม (GMV)</p>
              <p className="text-lg font-bold font-mono text-white">{formatCurrency(totalGMV)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/20 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <p className="text-[10px] font-bold text-emerald-300 uppercase">เงินเข้าบัญชีแล้ว</p>
              </div>
              <p className="text-lg font-bold font-mono text-white">{formatCurrency(settled)}</p>
            </div>
            {pending > 0 && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-400/20 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <p className="text-[10px] font-bold text-amber-300 uppercase">รอเงินเข้า</p>
                </div>
                <p className="text-lg font-bold font-mono text-white">{formatCurrency(pending)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Status Bar */}
        <div className="p-4 sm:p-5 border-b border-brown-100">
          <div className="space-y-3">
            <div className="h-3 rounded-full overflow-hidden flex bg-brown-100/50 p-0.5 border border-brown-100">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${settledPct}%` }} />
              <div className="bg-amber-400 h-full rounded-full mx-0.5" style={{ width: `${pendingPct}%` }} />
              <div className="bg-red-400 h-full rounded-full" style={{ width: `${ineligiblePct}%` }} />
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-700">Settled {settledPct.toFixed(0)}%</span>
              </div>
              {pendingPct > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-amber-700">Pending {pendingPct.toFixed(0)}%</span>
                </div>
              )}
              {ineligiblePct > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-red-700">Ineligible {ineligiblePct.toFixed(0)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="p-4 sm:p-5 space-y-2">
          {ineligible > 0 && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-800">ค่าคอมที่หล่นไป {formatCurrency(ineligible)}</p>
                <p className="text-xs text-red-600 mt-0.5">
                  ออเดอร์ไม่ได้คอม เพราะยกเลิกหรือไม่ผ่านเงื่อนไข
                  {ineligiblePct > 0 && ` (${ineligiblePct.toFixed(1)}% ของทั้งหมด)`}
                </p>
              </div>
            </div>
          )}
          {pending > 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
              <Banknote className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">ยังมีเงินค้างจ่าย ~{formatCurrency(pending)}</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  เงินกำลังรอ TikTok จ่าย ยังไม่หาย แค่ยังไม่เข้าบัญชี
                </p>
              </div>
            </div>
          )}
          <div className="pt-1">
            <p className="text-xs text-brown-400">
              Rate เฉลี่ย {(summary.avgCommissionRate * 100).toFixed(1)}%
              {summary.potentialGainIfIneligibleSettled > 0 && (
                <span className="ml-2 text-brown-600">
                  · Potential +{formatCurrency(summary.potentialGainIfIneligibleSettled)} ถ้า Ineligible กลายเป็น Settled
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Section: ร้านที่ทำเงินให้คุณ ── */}
      <DashboardSection
        id="affiliate-shops"
        title="ร้านที่ทำเงินให้คุณ"
        icon={<Store className="w-5 h-5" />}
        defaultOpen={true}
        summary={topShop ? `ตัวทำเงินหลัก: ${topShop.shopName} (${formatCurrency(topShop.amount)})` : ""}
        chartCount={1}
      >
        <AffiliateTopShopsChart data={shopsChartData} />

        {topShop && (
          <div className="rounded-xl border border-brown-200 bg-brown-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  topShopPct >= 60
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {topShopPct >= 60 ? "รายได้กระจุก" : "ควรดันต่อ"}
              </span>
              <p className="text-sm font-medium text-brown-800">{topShop.shopName}</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-brown-600">
              {topShopPct >= 60
                ? `ร้าน ${topShop.shopName} กินสัดส่วนรายได้สูงมาก ควรหาร้านสำรองเพิ่มเพื่อกันรายได้หายทั้งก้อน`
                : `ร้าน ${topShop.shopName} ยังเป็นตัวทำเงินหลักในตอนนี้ ถ้ายังปิดการขายดีอยู่สามารถเพิ่มคอนเทนต์ต่อได้`}
            </p>
          </div>
        )}

        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm min-w-80">
            <thead>
              <tr className="border-b border-brown-200">
                <th className="sticky left-0 z-10 text-left py-3 px-3 text-brown-600 font-bold uppercase text-[10px] tracking-wider bg-white">ร้านค้า</th>
                <th className="text-right py-3 px-3 text-brown-600 font-bold uppercase text-[10px] tracking-wider">ออเดอร์</th>
                <th className="text-right py-3 px-3 text-emerald-700 font-bold uppercase text-[10px] tracking-wider">ได้คอมจริง</th>
                <th className="text-right py-3 px-3 text-red-600 font-bold uppercase text-[10px] tracking-wider">คอมหล่น</th>
              </tr>
            </thead>
            <tbody>
              {visibleShops.map((shop) => (
                <tr key={shop.shopName} className="border-b border-brown-100 hover:bg-brown-50 transition-colors">
                  <td className="sticky left-0 z-10 py-3 px-3 font-medium text-brown-800 bg-white">{shop.shopName}</td>
                  <td className="py-3 px-3 text-right tabular-nums text-brown-600 font-mono">{shop.orderCount.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold text-emerald-700 font-mono">{formatCurrency(shop.amount)}</td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold text-red-600 font-mono">
                    {shop.ineligibleAmount > 0 ? formatCurrency(shop.ineligibleAmount) : <span className="text-brown-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedShops.length > SHOPS_PREVIEW && (
          <button
            onClick={() => setShowAllShops(!showAllShops)}
            className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold text-brown-600 bg-brown-50/50 hover:bg-brown-100 rounded-xl transition-all border border-brown-100"
          >
            {showAllShops ? (
              <>แสดงน้อยลง <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>ดูร้านค้าทั้งหมด ({sortedShops.length}) <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        )}

        {topShopPct >= 60 && sortedShops.length >= 2 && (
          <ActionableTip>
            {topShop!.shopName} ทำรายได้ {topShopPct.toFixed(0)}% ของทั้งหมด ถ้าร้านนี้สะดุด รายได้จะสะเทือนทันที ลองหาร้านสำรองเพิ่มเพื่อกระจายความเสี่ยง
          </ActionableTip>
        )}
      </DashboardSection>

      {/* ── Section: สินค้าที่ควรดันต่อ ── */}
      <DashboardSection
        id="affiliate-products"
        title="สินค้าที่ควรดันต่อ"
        icon={<Package className="w-5 h-5" />}
        defaultOpen={false}
        summary={topProduct ? `ตัวที่ทำเงินสุด: ${topProduct.productName.slice(0, 25)}` : ""}
        chartCount={1}
      >
        <div className="bg-white rounded-xl border border-brown-200 p-4">
          <h4 className="text-sm font-semibold text-brown-700 mb-3">สินค้าที่ทำเงินให้คุณมากสุด</h4>
          <AffiliateProductsChart data={productsChartData} />
        </div>

        {topProduct && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-medium text-emerald-700">สินค้าที่ควรเอาไปทำคอนเทนต์ต่อ</p>
            <p className="mt-1 text-sm font-semibold text-brown-800">{topProduct.productName}</p>
            <p className="mt-2 text-sm leading-relaxed text-brown-600">
              {topProduct.itemsSold >= 5 && topProduct.commission >= 1000
                ? `สินค้า ${topProduct.productName.slice(0, 20)} ทำทั้งยอดและค่าคอมดี เหมาะเอาไปทำคอนเทนต์ต่อทันที`
                : topProduct.itemsSold >= 5
                ? `สินค้า ${topProduct.productName.slice(0, 20)} ขายได้ต่อเนื่อง ลองทดสอบมุมคอนเทนต์ใหม่เพื่อรีดค่าคอมเพิ่ม`
                : `สินค้า ${topProduct.productName.slice(0, 20)} ยังไม่ติดมาก แต่เริ่มมีสัญญาณดี ถ้าจะลองดันเพิ่มควรเริ่มแบบประหยัดแรง`}
            </p>
          </div>
        )}

        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm min-w-100">
            <thead>
              <tr className="border-b border-brown-200">
                <th className="text-left py-3 px-3 text-brown-600 font-bold uppercase text-[10px] tracking-wider">สินค้า</th>
                <th className="text-right py-3 px-3 text-brown-600 font-bold uppercase text-[10px] tracking-wider">ขายได้</th>
                <th className="text-right py-3 px-3 text-brown-600 font-bold uppercase text-[10px] tracking-wider">ยอดขาย</th>
                <th className="text-right py-3 px-3 text-emerald-700 font-bold uppercase text-[10px] tracking-wider">ได้คอม</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((p) => (
                <tr
                  key={`${p.shopName}::${p.skuId}::${p.productName}`}
                  className="border-b border-brown-100 hover:bg-brown-50 transition-colors"
                >
                  <td className="py-3 px-3 font-medium text-brown-800 max-w-50 truncate" title={p.productName}>
                    {p.productName}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-brown-600 font-mono">{p.itemsSold.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right tabular-nums text-brown-600 font-mono">{formatCurrency(p.gmv)}</td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold text-emerald-700 font-mono">{formatCurrency(p.commission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedProducts.length > PRODUCTS_PREVIEW && (
          <button
            onClick={() => setShowAllProducts(!showAllProducts)}
            className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold text-brown-600 bg-brown-50/50 hover:bg-brown-100 rounded-xl transition-all border border-brown-100"
          >
            {showAllProducts ? (
              <>แสดงน้อยลง <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>ดูสินค้าทั้งหมด ({sortedProducts.length}) <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        )}

        {sortedProducts.length >= 3 && (
          <ActionableTip>
            สินค้าตัวบนสุดทำค่าคอม {formatCurrency(sortedProducts[0].commission)} ถ้าจะทำคอนเทนต์รอบถัดไป เริ่มจากกลุ่มนี้ก่อนจะคุ้มแรงกว่า
          </ActionableTip>
        )}
      </DashboardSection>
    </div>
  );
}
