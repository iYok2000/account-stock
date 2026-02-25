"use client";

import { useMemo } from "react";
import type { DataType } from "./file-parser";
import { getFieldsForType } from "./file-parser";

interface ColumnMapperProps {
  headers: string[];
  mappings: Map<number, string>;
  onMappingChange: (columnIndex: number, targetField: string) => void;
  dataType: DataType;
}

/** หาคอลัมน์ในไฟล์ที่จับคู่กับฟิลด์นี้ */
function getColumnIndexForField(mappings: Map<number, string>, field: string): number | null {
  for (const [colIdx, f] of mappings.entries()) {
    if (f === field) return colIdx;
  }
  return null;
}

export function ColumnMapper({
  headers,
  mappings,
  onMappingChange,
  dataType,
}: ColumnMapperProps) {
  const fields = useMemo(() => getFieldsForType(dataType), [dataType]);

  // Order Transaction: แสดงเฉพาะฟิลด์ในระบบ → เลือกคอลัมน์ในไฟล์ (จับคู่อัตโนมัติจากชื่อที่ตรงหรือใกล้เคียง)
  if (dataType === "order_transaction") {
    const requiredFields = fields.filter((f) => f.required);
    const optionalFields = fields.filter((f) => !f.required);

    return (
      <div className="space-y-4">
        <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-sm text-primary-800">
          <p className="font-medium">จับคู่จากชื่อที่ตรงหรือใกล้เคียง</p>
          <p className="mt-0.5 text-primary-700">
            ระบบจับคู่ให้อัตโนมัติ (เช่น SKUMAIN, รหัสสินค้า → SKU ID). ฟิลด์ที่มี * จำเป็นต้องมีข้อมูล
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
          <span className="flex-1">ฟิลด์ในระบบ</span>
          <span className="w-6" aria-hidden />
          <span className="flex-1">คอลัมน์ในไฟล์</span>
        </div>

        {requiredFields.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-500">จำเป็น *</p>
            {requiredFields.map((f) => {
              const currentCol = getColumnIndexForField(mappings, f.field);
              const value = currentCol !== null ? String(currentCol) : "";
              const matchedHeader = currentCol !== null ? (headers[currentCol] || `คอลัมน์ ${currentCol + 1}`) : null;

              return (
                <div
                  key={f.field}
                  className="flex items-center gap-3 rounded-md border border-amber-200/60 bg-amber-50/50 py-2 px-3"
                >
                  <span className="flex-1 text-sm font-medium text-foreground">
                    {f.label} <span className="text-amber-600">*</span>
                  </span>
                  <svg className="size-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <select
                      value={value}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        if (currentCol !== null) onMappingChange(currentCol, "");
                        if (newVal !== "") onMappingChange(Number(newVal), f.field);
                      }}
                      className="input-base w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label={`คอลัมน์สำหรับ ${f.label}`}
                    >
                      <option value="">— เลือกคอลัมน์ —</option>
                      {headers.map((header, index) => {
                        const usedByOther = mappings.get(index) && mappings.get(index) !== f.field;
                        return (
                          <option key={index} value={index} disabled={usedByOther}>
                            {header || `(คอลัมน์ ${index + 1})`}
                            {usedByOther ? " — ใช้แล้ว" : ""}
                          </option>
                        );
                      })}
                    </select>
                    {matchedHeader && value !== "" && (
                      <p className="mt-0.5 truncate text-xs text-neutral-500">จับคู่: {matchedHeader}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {optionalFields.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-500">ไม่บังคับ</p>
            <div className="space-y-0.5">
              {optionalFields.map((f) => {
                const currentCol = getColumnIndexForField(mappings, f.field);
                const value = currentCol !== null ? String(currentCol) : "";

                return (
                  <div
                    key={f.field}
                    className="flex items-center gap-3 border-b border-neutral-100 py-1.5 last:border-0"
                  >
                    <span className="flex-1 text-sm text-foreground">{f.label}</span>
                    <svg className="size-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <select
                        value={value}
                        onChange={(e) => {
                          const newVal = e.target.value;
                          if (currentCol !== null) onMappingChange(currentCol, "");
                          if (newVal !== "") onMappingChange(Number(newVal), f.field);
                        }}
                        className="input-base w-full rounded border border-neutral-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        aria-label={`คอลัมน์สำหรับ ${f.label}`}
                      >
                        <option value="">ไม่ใช้</option>
                        {headers.map((header, index) => {
                          const usedByOther = mappings.get(index) && mappings.get(index) !== f.field;
                          return (
                            <option key={index} value={index} disabled={usedByOther}>
                              {header || `(คอลัมน์ ${index + 1})`}
                              {usedByOther ? " — ใช้แล้ว" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Inventory / Orders: แบบเดิม (ทุกคอลัมน์ในไฟล์ → เลือกฟิลด์)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
        <span className="flex-1">คอลัมน์ในไฟล์</span>
        <span className="w-6" />
        <span className="flex-1">ฟิลด์ในระบบ</span>
      </div>

      {headers.map((header, index) => {
        const currentMapping = mappings.get(index) ?? "";

        return (
          <div
            key={index}
            className="flex items-center gap-2 border-b border-neutral-200 py-1.5 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{header || `(คอลัมน์ ${index + 1})`}</p>
              <p className="text-xs text-neutral-500">
                Column {index < 26 ? String.fromCharCode(65 + index) : `A${String.fromCharCode(65 + index - 26)}`}
              </p>
            </div>

            <svg className="size-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>

            <div className="flex-1">
              <select
                value={currentMapping}
                onChange={(e) => onMappingChange(index, e.target.value)}
                className="input-base w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">(ข้ามคอลัมน์นี้)</option>
                {fields.map((f) => {
                  const isUsedByOther = Array.from(mappings.entries()).some(
                    ([colIdx, field]) => field === f.field && colIdx !== index
                  );
                  return (
                    <option key={f.field} value={f.field} disabled={isUsedByOther}>
                      {f.label}
                      {f.required ? " *" : ""}
                      {isUsedByOther ? " (ใช้แล้ว)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        );
      })}

      <div className="border-t pt-2">
        <p className="mb-2 text-xs font-medium text-neutral-500">ฟิลด์ที่จำเป็น:</p>
        <p className="text-xs text-neutral-600">
          {fields.filter((f) => f.required).map((f) => f.label).join(", ")}
        </p>
      </div>
    </div>
  );
}
