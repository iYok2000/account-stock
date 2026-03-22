"use client";

import { useState, useCallback, useMemo, Fragment } from "react";
import { FileDropzone } from "./FileDropzone";
import { ColumnMapper } from "./ColumnMapper";
import { DataPreview } from "./DataPreview";
import {
  parseFile,
  autoDetectMappings,
  validateRows,
  aggregateOrderTransaction,
  aggregateAffiliateOrders,
  buildAffiliateImportItems,
  type ParsedData,
  type DataType,
  type ImportTier,
  type OrderTransactionSummary,
  type DailyRow,
  type SkuRow,
  type AffiliateSummary,
  type AffiliateImportItem,
} from "./file-parser";
import { formatCurrency } from "@/lib/utils";
import { useUserContext } from "@/contexts/AuthContext";
import { ChevronDown } from "lucide-react";
import { saveImportSnapshot } from "@/lib/import/storage";

type Step = "select-type" | "upload" | "mapping" | "result";

/** Phase 1: Order Transaction only per docs/feature/07-import.md */
const DATA_TYPE_OPTIONS: {
  type: DataType;
  label: string;
  description: string;
}[] = [
  {
    type: "affiliate_order",
    label: "Affiliate Orders / คอมมิชชัน (Affiliate)",
    description: "Import affiliate file (XLSX) เพื่อนสรุปคอมมิชชันตามร้านและสินค้า",
  },
  {
    type: "order_transaction",
    label: "Order Transaction (Owner)",
    description: "Import order transaction file เพื่อนำเข้ารายการขาย/คำสั่งซื้อ และสรุปยอดขายตาม SKU และรายได้",
  },
];

interface ImportResult {
  imported: number;
  skipped: number;
  duplicates: number;
  errors: string[];
  summary?: OrderTransactionSummary;
  daily?: DailyRow[];
  items?: SkuRow[];
  tier?: ImportTier;
  affiliateSummary?: AffiliateSummary;
  dataType: DataType;
}

interface ImportWizardProps {
  onClose?: () => void;
  onImportComplete?: (result: ImportResult) => void;
  defaultDataType?: DataType;
}

import { apiRequest } from "@/lib/api-client";
import type { InventoryImportPayloadApi, InventoryImportItemApi } from "@/types/api/inventory";
import { useImportInventory } from "@/lib/hooks/use-api";
import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "@/i18n/navigation";

export function ImportWizard({
  onClose,
  onImportComplete,
  defaultDataType,
}: ImportWizardProps) {
  const router = useRouter();
  const user = useUserContext();
  const role = user?.role ?? "Affiliate";
  const shopId = user?.shopId ?? null;
  const isRootPreview = Boolean(user?.isViewingAs && user.roles.includes("Root"));
  const isAffiliateOnly = role === "Affiliate";
  const isOwnerRole = !isAffiliateOnly;
  const { showSuccess, showError } = useToast();
  const importInventoryMutation = useImportInventory();
  const previewReadOnlyMessage =
    "กำลังดูในมุมมองจำลองของ Root จึงยังบันทึกข้อมูลไม่ได้ โปรดสลับกลับเป็น Root view ก่อน";

  const visibleOptions = useMemo(
    () =>
      DATA_TYPE_OPTIONS.filter((opt) => {
        if (opt.type === "order_transaction") return isOwnerRole;
        if (opt.type === "affiliate_order") return true;
        return true;
      }),
    [isOwnerRole]
  );

  const [step, setStep] = useState<Step>(defaultDataType ? "upload" : "select-type");
  const [dataType, setDataType] = useState<DataType>(defaultDataType ?? "order_transaction");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [mappings, setMappings] = useState<Map<number, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [tier, setTier] = useState<ImportTier>("free");
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [chartHoverShop, setChartHoverShop] = useState<string | null>(null);
  const [expandedProductTitleKey, setExpandedProductTitleKey] = useState<string | null>(null);
  const [affiliateSaved, setAffiliateSaved] = useState(false);
  const [inventorySaved, setInventorySaved] = useState(false);
  const [affiliateItems, setAffiliateItems] = useState<AffiliateImportItem[] | null>(null);

  const toFriendlyError = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes("order_id") && lower.includes("sku_id")) {
      return "ไฟล์ขาด Order ID หรือ SKU: โปรดตรวจ mapping และข้อมูลแถวว่าง";
    }
    if (
      lower.includes("date") &&
      (lower.includes("not-null") || lower.includes("null value"))
    ) {
      return "ข้อมูลวันที่ไม่ครบหรือรูปแบบไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)";
    }
    return msg;
  };

  const handleSelectType = (type: DataType) => {
    setDataType(type);
    setStep("upload");
    setError(null);
    setAffiliateSaved(false);
    setAffiliateItems(null);
    setInventorySaved(false);
  };

  const handleFileAccepted = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      setParseWarnings([]);
      try {
        const data = await parseFile(file);
        setParsedData(data);
        setParseWarnings(data.warnings);
        const autoMappings = autoDetectMappings(data.headers, dataType);
        setMappings(autoMappings);
        setStep("mapping");
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอ่านไฟล์");
      } finally {
        setIsLoading(false);
      }
    },
    [dataType]
  );

  const handleMappingChange = (columnIndex: number, targetField: string) => {
    setMappings((prev) => {
      const next = new Map(prev);
      if (targetField === "") {
        next.delete(columnIndex);
      } else {
        Array.from(next.entries()).forEach(([key, val]) => {
          if (val === targetField) next.delete(key);
        });
        next.set(columnIndex, targetField);
      }
      return next;
    });
  };

  const validation = parsedData
    ? validateRows(parsedData.rows, mappings, dataType)
    : null;

  const handleConfirmImport = useCallback(async () => {
    if (!parsedData || !validation || validation.errors.length > 0) return;
    if (dataType === "affiliate_order") {
      const affiliateSummary = aggregateAffiliateOrders(parsedData.rows, mappings);
      const itemsPayload = buildAffiliateImportItems(parsedData.rows, mappings);
      setAffiliateItems(itemsPayload);
      const result: ImportResult = {
        imported: validation.validCount,
        skipped: validation.invalidRows.length,
        duplicates: 0,
        errors: [],
        affiliateSummary,
        dataType: "affiliate_order",
      };
      setAffiliateSaved(false);
      setImportResult(result);
      setSelectedShop(null);
      setStep("result");
      onImportComplete?.(result);
      return;
    }
    setIsLoading(true);
    setError(null);
    const { summary, daily, items } = aggregateOrderTransaction(parsedData.rows, mappings, tier);
    const snapshot = {
      shopId,
      updatedAt: new Date().toISOString(),
      tier,
      summary,
      daily,
      items,
    };
    try {
      // Map SkuRow to InventoryImportItemApi (add required 'name' field)
      const itemsPayload: InventoryImportItemApi[] = items.map(item => ({
        ...item,
        name: item.product_name && item.variation 
          ? `${item.product_name} - ${item.variation}` 
          : item.product_name || item.sku_id,
      }));
      const payload: InventoryImportPayloadApi = { tier, items: itemsPayload };
      await apiRequest("/api/inventory/import", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const result: ImportResult = {
        imported: validation.validCount,
        skipped: validation.invalidRows.length,
        duplicates: 0,
        errors: [],
        summary,
        daily,
        items,
        tier,
        dataType: "order_transaction",
      };
      saveImportSnapshot(snapshot);
      setInventorySaved(true);
      setAffiliateSaved(false);
      setImportResult(result);
      setStep("result");
      onImportComplete?.(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่งข้อมูล";
      setError(toFriendlyError(msg));
      setInventorySaved(false);
      saveImportSnapshot(snapshot);
      setImportResult({
        imported: validation.validCount,
        skipped: validation.invalidRows.length,
        duplicates: 0,
        errors: [err instanceof Error ? err.message : "ส่ง API ไม่สำเร็จ"],
        summary,
        daily,
        items,
        tier,
        dataType: "order_transaction",
      });
      setStep("result");
    } finally {
      setIsLoading(false);
    }
  }, [parsedData, validation, dataType, tier, mappings, onImportComplete, shopId]);

  const handleReset = () => {
    setStep(defaultDataType ? "upload" : "select-type");
    setParsedData(null);
    setMappings(new Map());
    setError(null);
    setImportResult(null);
    setParseWarnings([]);
    setAffiliateSaved(false);
    setAffiliateItems(null);
    setInventorySaved(false);
  };

  const handleSaveAffiliate = async () => {
    if (!affiliateItems || affiliateItems.length === 0) return;
    if (isRootPreview) {
      setError(previewReadOnlyMessage);
      showError(previewReadOnlyMessage);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await apiRequest("/api/affiliate/import", {
        method: "POST",
        body: JSON.stringify({ items: affiliateItems }),
      });
      setAffiliateSaved(true);
      showSuccess("บันทึกผลการนำเข้า Affiliate ลงระบบแล้ว");
      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "บันทึกไม่สำเร็จ";
      setAffiliateSaved(false);
      const friendly = toFriendlyError(msg);
      setError(friendly);
      showError(friendly);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToInventory = async () => {
    if (!importResult || !importResult.items || importResult.items.length === 0) return;
    if (isRootPreview) {
      setError(previewReadOnlyMessage);
      showError(previewReadOnlyMessage);
      return;
    }
    const payload: InventoryImportPayloadApi = {
      items: importResult.items.map((row) => ({
        date: row.date ?? null,
        sku_id: row.sku_id,
        name: row.product_name && row.variation 
          ? `${row.product_name} - ${row.variation}` 
          : row.product_name || row.sku_id,
        seller_sku: row.seller_sku,
        product_name: row.product_name,
        variation: row.variation,
        quantity: row.quantity,
        revenue: row.revenue,
        deductions: row.deductions,
        refund: row.refund,
        net: row.net,
      })),
    };
    try {
      await importInventoryMutation.mutateAsync(payload);
      showSuccess("บันทึกเข้า inventory สำเร็จ");
      router.push("/");
    } catch (e) {
      showError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    }
  };

  const stepDescriptions: Record<Step, string> = {
    "select-type": "เลือกประเภทข้อมูลที่ต้องการนำเข้า (Owner vs Affiliate)",
    upload: `อัพโหลดไฟล์ ${DATA_TYPE_OPTIONS.find((d) => d.type === dataType)?.label ?? ""}`,
    mapping: "",
    result: "ผลการตรวจสอบ",
  };

  return (
    <div
      className={
        "card mx-auto w-full " +
        (step === "result" && importResult?.dataType === "affiliate_order" ? "max-w-6xl" : "max-w-2xl")
      }
    >
      <div className="flex flex-row items-center justify-between border-b border-neutral-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">นำเข้าข้อมูล</h2>
          <p className="text-sm text-neutral-500">{stepDescriptions[step]}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 transition-colors hover:bg-neutral-100"
            aria-label="ปิด"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>


      <div className="space-y-4 p-6">
        {step === "select-type" && (
          <div className="grid gap-3">
            {visibleOptions.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => handleSelectType(opt.type)}
                className="group flex flex-col items-start gap-1.5 rounded-xl border border-neutral-200 bg-white p-4 text-left text-sm transition-colors hover:border-primary/60 hover:bg-neutral-50"
              >
                <p className="font-semibold text-neutral-900">{opt.label}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{opt.description}</p>
              </button>
            ))}
          </div>
        )}

        {step === "upload" && (
          <div className="space-y-4">
            <FileDropzone
              onFileAccepted={handleFileAccepted}
              onError={setError}
              isLoading={isLoading}
            />
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>กำลังอ่านไฟล์...</span>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                <svg className="size-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            {!defaultDataType && (
              <button
                type="button"
                onClick={() => setStep("select-type")}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
              >
                ย้อนกลับ
              </button>
            )}
          </div>
        )}

        {step === "mapping" && parsedData && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-neutral-50 p-3">
              <div className="flex items-center gap-3">
                <svg className="size-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="text-sm">
                  <p className="font-medium">{parsedData.fileName}</p>
                  <p className="text-neutral-500">พบ {parsedData.totalRows.toLocaleString()} รายการ</p>
                </div>
              </div>
              {dataType === "order_transaction" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-neutral-600">ระดับ:</span>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as ImportTier)}
                    className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="free">ฟรี (สรุปเป็นวัน)</option>
                    <option value="paid">เสียเงิน (1 SKU = 1 record)</option>
                  </select>
                </div>
              )}
            </div>

            {dataType === "affiliate_order" ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4">
                  <h3 className="text-sm font-semibold text-neutral-800">Affiliate Orders — ระบบจับคู่คอลัมน์ให้อัตโนมัติ</h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    ใช้ header จากไฟล์ affiliate (เช่น Shop name, Total final earned amount) เพื่อ map เข้ากับฟิลด์ในระบบอัตโนมัติ
                    ขั้นนี้ใช้สำหรับดูตัวอย่างข้อมูลเท่านั้น ไม่ต้องแก้ mapping เอง
                  </p>
                  <p className="mt-3 text-xs font-medium text-neutral-700">ฟิลด์ที่ระบบต้องใช้ (ต้อง map ได้ครบ):</p>
                  <ul className="mt-1.5 list-inside list-disc text-sm text-neutral-600">
                    <li>Order ID</li>
                    <li>Product name</li>
                    <li>Shop name</li>
                    <li>Total final earned amount (ยอดสุทธิรายได้)</li>
                    <li>Order settlement status</li>
                  </ul>
                  {validation && validation.errors.length > 0 && (
                    <p className="mt-2 text-xs text-amber-700">
                      ยังจับคู่ไม่ครบ: {validation.errors.join(" ")}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-3 text-sm font-medium">ฟิลด์ในระบบ ↔ คอลัมน์ในไฟล์</p>
                <ColumnMapper
                  headers={parsedData.headers}
                  mappings={mappings}
                  onMappingChange={handleMappingChange}
                  dataType={dataType}
                />
              </div>
            )}

            <DataPreview
              headers={parsedData.headers}
              rows={parsedData.rows}
              maxRows={10}
              invalidRows={validation?.invalidRows}
              mappings={mappings}
            />

            {parseWarnings.length > 0 && (
              <div className="space-y-1 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                <p className="font-medium">พบข้อมูลที่ถูกทำให้ปลอดภัย:</p>
                {parseWarnings.slice(0, 5).map((w, i) => (
                  <p key={i} className="text-xs">{w}</p>
                ))}
                {parseWarnings.length > 5 && (
                  <p className="text-xs">...และอีก {parseWarnings.length - 5} รายการ</p>
                )}
              </div>
            )}

            {validation && validation.errors.length > 0 && (
              <div className="space-y-1 rounded-md bg-red-50 p-3 text-sm text-red-700">
                {validation.errors.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            )}

            {validation && validation.rowErrors.length > 0 && (
              <div className="space-y-1 rounded-md bg-red-50 p-3 text-xs text-red-700">
                {validation.rowErrors.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={!validation || validation.errors.length > 0}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {dataType === "affiliate_order" ? "Process" : "Process และส่งไปบันทึก"}
              </button>
            </div>
          </div>
        )}

        {step === "result" && importResult && (
          <div className="space-y-4">
            {importResult.errors.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {importResult.errors.map((e, i) => (
                  <p key={i}>{e}</p>
                ))}
              </div>
            )}

            {/* Affiliate result: สรุป + ตารางร้าน (แสดงก่อน) */}
            {importResult.dataType === "affiliate_order" && importResult.affiliateSummary && (
              <div className="space-y-6">
                <h3 className="text-base font-semibold text-neutral-800">Summary — นำเข้า Affiliate Orders</h3>
                {(() => {
                  const totalAll = importResult.affiliateSummary.totalCommission || 0;
                  const totalEligible = importResult.affiliateSummary.totalEligibleCommission ?? totalAll;
                  const settled = importResult.affiliateSummary.byStatus
                    .filter((s) => s.status.toLowerCase().includes("settled"))
                    .reduce((sum, s) => sum + s.amount, 0);
                  const ineligible = importResult.affiliateSummary.byStatus
                    .filter((s) => s.status.toLowerCase().includes("ineligible"))
                    .reduce((sum, s) => sum + s.amount, 0);
                  const other = Math.max(totalAll - settled - ineligible, 0);
                  const settledRatio = totalAll > 0 ? (settled / totalAll) * 100 : 0;
                  const ineligibleRatio = totalAll > 0 ? (ineligible / totalAll) * 100 : 0;

                  return (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">ยอดรายได้ที่นำมาคิด</p>
                        <p className="mt-2 text-2xl font-semibold text-neutral-900">
                          {formatCurrency(totalEligible)}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          Est. standard + Est. Shop Ads · จาก {importResult.imported.toLocaleString()} แถว
                        </p>
                      </div>
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Settled (จ่ายแล้ว)</p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-900">{formatCurrency(settled)}</p>
                        <p className="mt-1 text-xs text-emerald-800">คิดเป็น {settledRatio.toFixed(1)}% ของทั้งหมด</p>
                      </div>
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Ineligible (ไม่ได้รับ)</p>
                        <p className="mt-2 text-2xl font-semibold text-amber-900">{formatCurrency(ineligible)}</p>
                        <p className="mt-1 text-xs text-amber-800">{ineligibleRatio.toFixed(1)}% ของทั้งหมด</p>
                      </div>
                    </div>
                  );
                })()}

                <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
                  <p className="font-medium text-neutral-800">
                    Commission Rate เฉลี่ย (รวม): {(importResult.affiliateSummary.avgCommissionRate * 100).toFixed(1)}%
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    ถ้า Ineligible กลายเป็น Settled ได้ทั้งหมด จะได้เพิ่มอีกประมาณ{" "}
                    {formatCurrency(importResult.affiliateSummary.potentialGainIfIneligibleSettled)} บาท
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-200 overflow-hidden bg-white shadow-sm">
                  <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                    <p className="font-medium text-neutral-800">ร้านที่สร้างคอมมิชชัน</p>
                    <p className="text-sm text-neutral-500">คลิกรายการร้านเพื่อขยายดูสินค้าในร้าน (collapse)</p>
                  </div>
                  <div className="max-h-[32rem] overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-neutral-100">
                        <tr>
                          <th className="w-10 px-2 py-3" aria-label="ขยาย/ย่อ" />
                          <th className="px-4 py-3 text-left font-medium text-neutral-700">ร้านค้า</th>
                          <th className="px-4 py-3 text-right font-medium text-neutral-700">จำนวน order</th>
                          <th className="px-4 py-3 text-right font-medium text-neutral-700">ยอดขาย</th>
                          <th className="px-4 py-3 text-right font-medium text-neutral-700">ค่าคอมที่ได้</th>
                          <th className="px-4 py-3 text-right font-medium text-neutral-700">ยอดที่ขาดรายได้ไป</th>
                          <th className="px-4 py-3 text-right font-medium text-neutral-700">Commission Rate เฉลี่ย</th>
                          <th className="px-4 py-3 text-right font-medium text-neutral-700">% ของยอดรายได้</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.affiliateSummary.byShop
                          .slice()
                          .sort((a, b) => b.amount - a.amount)
                          .map((shop) => {
                            const isExpanded = selectedShop === shop.shopName;
                            const products = (importResult.affiliateSummary?.products ?? [])
                              .filter((p) => p.shopName === shop.shopName)
                              .sort((a, b) => b.commission - a.commission);
                            return (
                              <Fragment key={shop.shopName}>
                                <tr
                                  role="button"
                                  tabIndex={0}
                                  aria-expanded={isExpanded}
                                  onClick={() =>
                                    setSelectedShop((prev) => (prev === shop.shopName ? null : shop.shopName))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      setSelectedShop((prev) => (prev === shop.shopName ? null : shop.shopName));
                                    }
                                  }}
                                  className={`border-b border-neutral-100 transition-colors hover:bg-neutral-50 cursor-pointer select-none ${
                                    isExpanded ? "bg-primary/5 border-l-4 border-l-primary" : ""
                                  }`}
                                >
                                  <td className="px-2 py-3 text-neutral-500">
                                    <ChevronDown
                                      className={`size-5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                      aria-hidden
                                    />
                                  </td>
                                  <td className="px-4 py-3 font-medium text-neutral-900">{shop.shopName}</td>
                                  <td className="px-4 py-3 text-right tabular-nums">{shop.orderCount.toLocaleString()}</td>
                                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(shop.gmv)}</td>
                                  <td className="px-4 py-3 text-right tabular-nums font-medium text-neutral-900">
                                    {formatCurrency(shop.amount)}
                                  </td>
                                  <td className="px-4 py-3 text-right tabular-nums text-amber-700">
                                    {formatCurrency(shop.ineligibleAmount)}
                                  </td>
                                  <td className="px-4 py-3 text-right tabular-nums">
                                    {shop.gmv > 0 ? `${((shop.amount / shop.gmv) * 100).toFixed(1)}%` : "—"}
                                  </td>
                                  <td className="px-4 py-3 text-right tabular-nums">{(shop.ratio * 100).toFixed(1)}%</td>
                                </tr>
                                {isExpanded && (
                                  <tr key={`${shop.shopName}-detail`} className="bg-neutral-50/80">
                                    <td colSpan={8} className="p-0 align-top">
                                      <div className="border-t border-neutral-200 bg-white px-3 py-4 sm:px-4">
                                        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
                                          สินค้าในร้าน — {products.length} รายการ (ตารางหลัก = ผลรวมของร้าน)
                                        </p>
                                        <div className="grid grid-cols-1 gap-3 min-w-0 sm:grid-cols-2 lg:grid-cols-3">
                                          {products.map((p) => {
                                            const productKey = `${shop.shopName}::${p.skuId}::${p.productName}`;
                                            const isTitleExpanded = expandedProductTitleKey === productKey;
                                            return (
                                            <div
                                              key={productKey}
                                              className="min-w-0 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4"
                                            >
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setExpandedProductTitleKey((k) => (k === productKey ? null : productKey))
                                                }
                                                className={`w-full text-left text-sm font-medium text-neutral-900 outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 rounded ${
                                                  isTitleExpanded ? "break-words" : "truncate"
                                                }`}
                                                title={isTitleExpanded ? "คลิกเพื่อย่อ" : "คลิกเพื่อดูชื่อเต็ม"}
                                              >
                                                {p.productName}
                                              </button>
                                              <p className="mt-0.5 text-[10px] text-neutral-400 sm:text-xs" aria-hidden>
                                                {isTitleExpanded ? "คลิกเพื่อย่อ" : "คลิกเพื่อดูชื่อเต็ม"}
                                              </p>
                                              {p.skuId ? (
                                                <p className="mt-0.5 text-xs text-neutral-500">SKU: {p.skuId}</p>
                                              ) : null}
                                              <dl className="mt-3 space-y-1.5 text-xs">
                                                <div className="flex justify-between gap-2">
                                                  <dt className="text-neutral-500">จำนวนขาย</dt>
                                                  <dd className="tabular-nums font-medium">{p.itemsSold.toLocaleString()}</dd>
                                                </div>
                                                <div className="flex justify-between gap-2">
                                                  <dt className="text-neutral-500">ยอดขาย</dt>
                                                  <dd className="tabular-nums">{formatCurrency(p.gmv)}</dd>
                                                </div>
                                                <div className="flex justify-between gap-2">
                                                  <dt className="text-neutral-500">ค่าคอมที่ได้</dt>
                                                  <dd className="tabular-nums font-medium text-emerald-700">
                                                    {formatCurrency(p.commission)}
                                                  </dd>
                                                </div>
                                                <div className="flex justify-between gap-2">
                                                  <dt className="text-neutral-500">ค่าคอมที่ขาดรายได้ไป</dt>
                                                  <dd className="tabular-nums font-medium text-amber-700">
                                                    {p.ineligibleAmount != null && p.ineligibleAmount > 0
                                                      ? formatCurrency(p.ineligibleAmount)
                                                      : "—"}
                                                  </dd>
                                                </div>
                                                <div className="flex justify-between gap-2 border-t border-neutral-100 pt-1.5">
                                                  <dt className="text-neutral-500">Rate</dt>
                                                  <dd className="tabular-nums">{(p.rate * 100).toFixed(1)}%</dd>
                                                </div>
                                              </dl>
                                            </div>
                                          );
                                          })}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {importResult.dataType === "order_transaction" && importResult.summary && (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-2">
                <p className="font-medium text-neutral-800">สรุป</p>
                <p className="text-sm">จำนวนแถว: {importResult.summary.totalRows.toLocaleString()}</p>
                <p className="text-sm">รายได้รวม: {formatCurrency(importResult.summary.totalRevenue)}</p>
                <p className="text-sm">หักรวม: {formatCurrency(importResult.summary.totalDeductions)}</p>
                <p className="text-sm">คืนรวม: {formatCurrency(importResult.summary.totalRefund)}</p>
                <p className="text-sm font-medium">
                  สุทธิ: {formatCurrency(importResult.summary.totalRevenue - importResult.summary.totalDeductions - importResult.summary.totalRefund)}
                </p>
                {importResult.summary.dateFrom && importResult.summary.dateTo && (
                  <p className="text-xs text-neutral-500">
                    ช่วงวันที่: {importResult.summary.dateFrom} ถึง {importResult.summary.dateTo}
                  </p>
                )}
              </div>
            )}
            {importResult.dataType === "order_transaction" &&
              importResult.tier === "free" &&
              importResult.daily &&
              importResult.daily.length > 0 && (
              <div className="rounded-md border border-neutral-200 overflow-hidden">
                <p className="bg-neutral-100 px-3 py-2 text-sm font-medium">สรุปตามวัน</p>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200">
                        <th className="px-2 py-1.5 text-left font-medium">วัน</th>
                        <th className="px-2 py-1.5 text-right font-medium">รายได้</th>
                        <th className="px-2 py-1.5 text-right font-medium">หัก</th>
                        <th className="px-2 py-1.5 text-right font-medium">คืน</th>
                        <th className="px-2 py-1.5 text-right font-medium">สุทธิ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.daily.slice(0, 31).map((d) => (
                        <tr key={d.date} className="border-b border-neutral-100">
                          <td className="px-2 py-1.5">{d.date}</td>
                          <td className="px-2 py-1.5 text-right">{formatCurrency(d.revenue)}</td>
                          <td className="px-2 py-1.5 text-right">{formatCurrency(d.deductions_breakdown.total ?? 0)}</td>
                          <td className="px-2 py-1.5 text-right">{formatCurrency(d.refund)}</td>
                          <td className="px-2 py-1.5 text-right">{formatCurrency(d.net)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importResult.daily.length > 31 && (
                  <p className="px-3 py-1.5 text-xs text-neutral-500">แสดง 31 วันแรก จาก {importResult.daily.length} วัน</p>
                )}
              </div>
            )}
            {importResult.dataType === "order_transaction" &&
              importResult.items &&
              importResult.items.length > 0 && (
              <div className="rounded-md border border-neutral-200 overflow-hidden">
                <p className="bg-neutral-100 px-3 py-2 text-sm font-medium">รายการตาม SKU ({importResult.items.length} รายการ)</p>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200">
                        <th className="px-2 py-1.5 text-left font-medium">วันที่</th>
                        <th className="px-2 py-1.5 text-left font-medium">SKU ID</th>
                        <th className="px-2 py-1.5 text-right font-medium">รายได้</th>
                        <th className="px-2 py-1.5 text-right font-medium">หัก</th>
                        <th className="px-2 py-1.5 text-right font-medium">คืน</th>
                        <th className="px-2 py-1.5 text-right font-medium">สุทธิ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.items.slice(0, 50).map((row, i) => (
                        <tr key={`${row.sku_id}-${i}`} className="border-b border-neutral-100">
                          <td className="px-2 py-1.5 whitespace-nowrap">{row.date ?? "—"}</td>
                          <td className="px-2 py-1.5 truncate max-w-[120px]" title={row.sku_id}>{row.sku_id}</td>
                          <td className="px-2 py-1.5 text-right">{formatCurrency(row.revenue)}</td>
                          <td className="px-2 py-1.5 text-right">{formatCurrency(row.deductions)}</td>
                          <td className="px-2 py-1.5 text-right">{formatCurrency(row.refund)}</td>
                          <td className="px-2 py-1.5 text-right">{formatCurrency(row.net)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importResult.items.length > 50 && (
                  <p className="px-3 py-1.5 text-xs text-neutral-500">แสดง 50 รายการแรก จาก {importResult.items.length} SKU</p>
                )}
              </div>
            )}
            {importResult.dataType !== "affiliate_order" && (
              <div className="rounded-md bg-neutral-50 p-3 text-sm">
                <p>ผ่านการตรวจสอบ: {importResult.imported.toLocaleString()}</p>
                <p>ข้าม (ข้อมูลไม่ครบ): {importResult.skipped}</p>
              </div>
            )}
            {isRootPreview && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {previewReadOnlyMessage}
              </div>
            )}
            <div className="flex gap-2 flex-wrap items-center">
              {importResult.dataType === "affiliate_order" && importResult.affiliateSummary && !affiliateSaved && (
                <button
                  type="button"
                  onClick={handleSaveAffiliate}
                  disabled={isRootPreview || isLoading}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  บันทึก
                </button>
              )}
              {importResult.dataType === "affiliate_order" && affiliateSaved && (
                <span className="text-sm text-neutral-500">บันทึกแล้ว — ต้องการบันทึกชุดใหม่ให้กด &quot;นำเข้าไฟล์ใหม่&quot;</span>
              )}
              {importResult.dataType === "order_transaction" && isOwnerRole && importResult.items?.length ? (
                <button
                  type="button"
                  onClick={handleSaveToInventory}
                  disabled={isRootPreview || importInventoryMutation.isPending}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {importInventoryMutation.isPending ? "กำลังบันทึก..." : "บันทึกเข้า Inventory"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleReset}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                นำเข้าไฟล์ใหม่
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                >
                  ปิด
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
