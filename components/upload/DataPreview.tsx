"use client";

interface DataPreviewProps {
  headers: string[];
  rows: string[][];
  maxRows?: number;
  invalidRows?: number[];
  mappings?: Map<number, string>;
}

export function DataPreview({
  headers,
  rows,
  maxRows = 5,
  invalidRows = [],
  mappings,
}: DataPreviewProps) {
  const previewRows = rows.slice(0, maxRows);
  const invalidSet = new Set(invalidRows);
  const mappedColumns = mappings ? new Set(mappings.keys()) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          ตัวอย่าง {Math.min(maxRows, rows.length)} แถวแรก
          {rows.length > maxRows && (
            <span className="font-normal text-neutral-500">
              {" "}(จากทั้งหมด {rows.length.toLocaleString()} แถว)
            </span>
          )}
        </p>
        {invalidRows.length > 0 && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            {invalidRows.length} รายการมีข้อมูลไม่ครบ
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border border-neutral-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-neutral-50">
              <th className="w-8 px-2 py-2 text-left font-medium text-neutral-500">#</th>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={`px-2 py-2 text-left font-medium ${
                    mappedColumns && !mappedColumns.has(i)
                      ? "text-neutral-400"
                      : "text-neutral-700"
                  }`}
                >
                  {h || `Col ${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`border-t border-neutral-100 ${
                  invalidSet.has(rowIdx) ? "bg-red-50" : ""
                }`}
              >
                <td className="px-2 py-1.5 text-neutral-500">{rowIdx + 1}</td>
                {headers.map((_, colIdx) => (
                  <td key={colIdx} className="max-w-[200px] truncate px-2 py-1.5">
                    {row[colIdx] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
