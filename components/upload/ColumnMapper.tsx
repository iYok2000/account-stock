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

export function ColumnMapper({
  headers,
  mappings,
  onMappingChange,
  dataType,
}: ColumnMapperProps) {
  const fields = useMemo(() => getFieldsForType(dataType), [dataType]);

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
