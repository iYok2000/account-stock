"use client";

import { useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = {
  "text/csv": [".csv"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface FileDropzoneProps {
  onFileAccepted: (file: File) => void;
  onError: (message: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function FileDropzone({
  onFileAccepted,
  onError,
  isLoading,
  className,
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        const errorCode = rejection.errors[0]?.code;
        if (errorCode === "file-too-large") {
          onError("ไฟล์มีขนาดเกิน 10MB กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่า");
        } else if (errorCode === "file-invalid-type") {
          onError("รองรับเฉพาะไฟล์ .xlsx และ .csv เท่านั้น");
        } else {
          onError("ไฟล์ไม่ถูกต้อง กรุณาลองใหม่");
        }
        return;
      }
      if (acceptedFiles.length > 0) {
        onFileAccepted(acceptedFiles[0]);
      }
    },
    [onFileAccepted, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: isLoading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-neutral-300 hover:border-primary/50 hover:bg-neutral-50",
        isLoading && "pointer-events-none opacity-50",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3 text-center">
        {isDragActive ? (
          <>
            <svg className="size-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium text-primary">วางไฟล์ที่นี่</p>
          </>
        ) : (
          <>
            <svg className="size-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <p className="text-sm font-medium">ลากไฟล์มาวางที่นี่</p>
              <p className="text-sm text-neutral-500">หรือ คลิกเพื่อเลือกไฟล์</p>
            </div>
            <p className="text-xs text-neutral-500">
              รองรับ: .xlsx, .csv | ขนาดสูงสุด: 10MB | สูงสุด 50,000 แถว
            </p>
          </>
        )}
      </div>
    </div>
  );
}
