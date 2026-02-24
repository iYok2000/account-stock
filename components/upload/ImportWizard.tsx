"use client";

import { useState, useCallback } from "react";
import { FileDropzone } from "./FileDropzone";
import { ColumnMapper } from "./ColumnMapper";
import { DataPreview } from "./DataPreview";
import {
  parseFile,
  autoDetectMappings,
  validateRows,
  aggregateOrderTransaction,
  type ParsedData,
  type DataType,
  type ImportTier,
  type OrderTransactionSummary,
  type DailyRow,
  type SkuRow,
} from "./file-parser";
import { formatCurrency } from "@/lib/utils";

type Step = "select-type" | "upload" | "mapping" | "result";

/** Phase 1: Order Transaction only per docs/feature/07-import.md */
const DATA_TYPE_OPTIONS: {
  type: DataType;
  label: string;
  icon: string;
  description: string;
}[] = [
  { type: "order_transaction", label: "Order Transaction", icon: "📋", description: "นำเข้ารายการขาย/คำสั่งซื้อ เพื่อสรุปยอดขายตาม SKU และรายได้" },
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
}

interface ImportWizardProps {
  onClose?: () => void;
  onImportComplete?: (result: ImportResult) => void;
  defaultDataType?: DataType;
}

const API_BASE = typeof window !== "undefined" ? "" : "";

export function ImportWizard({
  onClose,
  onImportComplete,
  defaultDataType,
}: ImportWizardProps) {
  const [step, setStep] = useState<Step>(defaultDataType ? "upload" : "select-type");
  const [dataType, setDataType] = useState<DataType>(defaultDataType ?? "order_transaction");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [mappings, setMappings] = useState<Map<number, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [tier, setTier] = useState<ImportTier>("free");

  const handleSelectType = (type: DataType) => {
    setDataType(type);
    setStep("upload");
    setError(null);
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
    if (dataType !== "order_transaction") {
      const result: ImportResult = {
        imported: validation.validCount,
        skipped: validation.invalidRows.length,
        duplicates: 0,
        errors: [],
      };
      setImportResult(result);
      setStep("result");
      onImportComplete?.(result);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { summary, daily, items } = aggregateOrderTransaction(parsedData.rows, mappings, tier);
      const payload = tier === "free"
        ? { tier: "free" as const, summary, daily }
        : { tier: "paid" as const, summary, items };
      const res = await fetch(`${API_BASE}/api/import/order-transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
      }
      const result: ImportResult = {
        imported: validation.validCount,
        skipped: validation.invalidRows.length,
        duplicates: 0,
        errors: [],
        summary,
        daily,
        items,
        tier,
      };
      setImportResult(result);
      setStep("result");
      onImportComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่งข้อมูล");
      const { summary, daily, items } = aggregateOrderTransaction(parsedData.rows, mappings, tier);
      setImportResult({
        imported: validation.validCount,
        skipped: validation.invalidRows.length,
        duplicates: 0,
        errors: [err instanceof Error ? err.message : "ส่ง API ไม่สำเร็จ"],
        summary,
        daily,
        items,
        tier,
      });
      setStep("result");
    } finally {
      setIsLoading(false);
    }
  }, [parsedData, validation, dataType, tier, mappings, onImportComplete]);

  const handleReset = () => {
    setStep(defaultDataType ? "upload" : "select-type");
    setParsedData(null);
    setMappings(new Map());
    setError(null);
    setImportResult(null);
    setParseWarnings([]);
  };

  const stepDescriptions: Record<Step, string> = {
    "select-type": "เลือกประเภทข้อมูลที่ต้องการนำเข้า",
    upload: `อัพโหลดไฟล์ ${DATA_TYPE_OPTIONS.find((d) => d.type === dataType)?.label ?? ""}`,
    mapping: "ตรวจสอบและจับคู่คอลัมน์",
    result: "ผลการตรวจสอบ",
  };

  return (
    <div className="card mx-auto w-full max-w-2xl">
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

      <div className="border-b border-neutral-100 bg-neutral-50 px-6 py-2">
        <p className="text-xs text-neutral-600">
          Phase 1: Order Transaction — สรุปยอดขายตาม SKU และรายได้ (ฟรี: สรุปเป็นวัน; เสียเงิน: 1 SKU = 1 record)
        </p>
      </div>

      <div className="space-y-4 p-6">
        {step === "select-type" && (
          <div className="grid gap-3">
            {DATA_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => handleSelectType(opt.type)}
                className="flex items-center gap-4 rounded-lg border border-neutral-200 p-4 text-left transition-colors hover:border-primary hover:bg-neutral-50"
              >
                <span className="text-2xl">{opt.icon}</span>
                <div>
                  <p className="font-medium">{opt.label}</p>
                  <p className="text-sm text-neutral-500">{opt.description}</p>
                </div>
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

            <div>
              <p className="mb-3 text-sm font-medium">จับคู่คอลัมน์</p>
              <ColumnMapper
                headers={parsedData.headers}
                mappings={mappings}
                onMappingChange={handleMappingChange}
                dataType={dataType}
              />
            </div>

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
                Process และส่งไปบันทึก
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
            {importResult.summary && (
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
            {importResult.tier === "free" && importResult.daily && importResult.daily.length > 0 && (
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
            {importResult.tier === "paid" && importResult.items && importResult.items.length > 0 && (
              <div className="rounded-md border border-neutral-200 overflow-hidden">
                <p className="bg-neutral-100 px-3 py-2 text-sm font-medium">รายการตาม SKU ({importResult.items.length} รายการ)</p>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200">
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
            <div className="rounded-md bg-neutral-50 p-3 text-sm">
              <p>ผ่านการตรวจสอบ: {importResult.imported.toLocaleString()}</p>
              <p>ข้าม (ข้อมูลไม่ครบ): {importResult.skipped}</p>
            </div>
            <div className="flex gap-2">
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
