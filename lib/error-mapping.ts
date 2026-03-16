/**
 * Error mapping service — แปลง API error response เป็น user-friendly message
 * รองรับสองภาษา (en, th)
 */

export type ErrorMapping = {
  en: string;
  th: string;
};

/**
 * Error mapping สำหรับ API errors ต่างๆ
 * Key = error message จาก backend
 */
export const ERROR_MESSAGES: Record<string, ErrorMapping> = {
  // User/member management errors
  "email already exists": {
    en: "This email is already registered.",
    th: "อีเมลนี้ถูกลงทะเบียนแล้ว",
  },
  "user not found": {
    en: "User not found.",
    th: "ไม่พบผู้ใช้",
  },
  "invalid email": {
    en: "Invalid email format.",
    th: "รูปแบบอีเมลไม่ถูกต้อง",
  },
  "password too short": {
    en: "Password is too short.",
    th: "รหัสผ่านสั้นเกินไป",
  },
  "unauthorized": {
    en: "You don't have permission to perform this action.",
    th: "คุณไม่มีสิทธิ์ทำรายการนี้",
  },
  "forbidden": {
    en: "Access denied.",
    th: "ไม่อนุญาตให้เข้าถึง",
  },
  "permission denied": {
    en: "You don't have permission to perform this action.",
    th: "คุณไม่มีสิทธิ์ทำรายการนี้",
  },
  "invalid role": {
    en: "Invalid role specified.",
    th: "บทบาทที่ระบุไม่ถูกต้อง",
  },
  
  // Shop errors
  "shop not found": {
    en: "Shop not found.",
    th: "ไม่พบร้าน",
  },
  "shop name required": {
    en: "Shop name is required.",
    th: "ต้องระบุชื่อร้าน",
  },
  
  // Import errors
  "file too large": {
    en: "File is too large.",
    th: "ไฟล์ใหญ่เกินไป",
  },
  "invalid file format": {
    en: "Invalid file format.",
    th: "รูปแบบไฟล์ไม่ถูกต้อง",
  },
  "import failed": {
    en: "Import failed.",
    th: "นำเข้าข้อมูลไม่สำเร็จ",
  },
  
  // Inventory errors
  "sku already exists": {
    en: "This SKU already exists.",
    th: "SKU นี้มีอยู่แล้ว",
  },
  "invalid quantity": {
    en: "Invalid quantity.",
    th: "จำนวนไม่ถูกต้อง",
  },
  
  // Generic/default errors
  "unknown error": {
    en: "An unknown error occurred.",
    th: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
  },
  "network error": {
    en: "Network error. Please check your connection.",
    th: "เกิดข้อผิดพลาดเครือข่าย กรุณาตรวจสอบการเชื่อมต่อ",
  },
  "server error": {
    en: "Server error. Please try again later.",
    th: "เกิดข้อผิดพลาดเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง",
  },
};

/**
 * แปลง error message จาก API เป็น user-friendly message
 * @param error - Error object หรือ error message string
 * @param locale - ภาษา (en, th)
 * @returns User-friendly error message
 */
export function mapErrorMessage(error: unknown, locale: "en" | "th"): string {
  // ถ้าเป็น Error object ให้เอา message
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // ตัด prefix ต่างๆ ออก (เช่น "HTTP 400: ", "Error: ")
  const cleanMessage = errorMessage
    .toLowerCase()
    .replace(/^error:\s*/i, "")
    .replace(/^http \d+:\s*/i, "")
    .trim();
  
  // ค้นหา error mapping ที่ตรงกับ error message
  // ลองหา exact match ก่อน
  const exactMatch = ERROR_MESSAGES[cleanMessage];
  if (exactMatch) {
    return exactMatch[locale];
  }
  
  // ถ้าไม่เจอ ลองหา partial match
  const partialMatch = Object.entries(ERROR_MESSAGES).find(([key]) =>
    cleanMessage.includes(key.toLowerCase())
  );
  if (partialMatch) {
    return partialMatch[1][locale];
  }
  
  // ถ้าไม่เจอเลย ใช้ unknown error
  return ERROR_MESSAGES["unknown error"][locale];
}

/**
 * แปลง error และแสดงใน toast/alert
 * @param error - Error object
 * @param locale - ภาษา (en, th)
 * @param showError - Function สำหรับแสดง error (เช่น toast.showError)
 */
export function handleApiError(
  error: unknown,
  locale: "en" | "th",
  showError: (message: string) => void
): void {
  const message = mapErrorMessage(error, locale);
  showError(message);
}
