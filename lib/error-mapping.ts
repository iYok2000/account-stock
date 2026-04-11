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
  // Auth errors
  UNAUTHORIZED: {
    en: "Please log in to continue.",
    th: "กรุณาเข้าสู่ระบบก่อน",
  },
  UNAUTHORIZED_NO_TOKEN: {
    en: "Please log in to continue.",
    th: "กรุณาเข้าสู่ระบบก่อน",
  },
  UNAUTHORIZED_EXPIRED: {
    en: "Your session has expired. Please log in again.",
    th: "เซสชันหมดอายุแล้ว กรุณาเข้าสู่ระบบอีกครั้ง",
  },
  UNAUTHORIZED_INVALID: {
    en: "Invalid credentials. Please check your email and password.",
    th: "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง",
  },
  FORBIDDEN: {
    en: "You don't have permission to perform this action.",
    th: "คุณไม่มีสิทธิ์ทำรายการนี้",
  },
  FORBIDDEN_NO_PERMISSION: {
    en: "You don't have the required permission.",
    th: "คุณไม่มีสิทธิ์ที่จะทำรายการนี้",
  },
  "permission denied": {
    en: "You don't have permission to perform this action.",
    th: "คุณไม่มีสิทธิ์ทำรายการนี้",
  },
  "access denied": {
    en: "Access denied.",
    th: "ไม่อนุญาตให้เข้าถึง",
  },

  // Not found errors
  NOT_FOUND: {
    en: "The requested resource was not found.",
    th: "ไม่พบข้อมูลที่ค้นหา",
  },
  NOT_FOUND_USER: {
    en: "User not found.",
    th: "ไม่พบผู้ใช้",
  },
  NOT_FOUND_SHOP: {
    en: "Shop not found.",
    th: "ไม่พบร้าน",
  },
  NOT_FOUND_COMPANY: {
    en: "Company not found.",
    th: "ไม่พบบริษัท",
  },
  NOT_FOUND_INVENTORY: {
    en: "Inventory item not found.",
    th: "ไม่พบรายการสินค้าในคลัง",
  },
  "user not found": {
    en: "User not found.",
    th: "ไม่พบผู้ใช้",
  },
  "shop not found": {
    en: "Shop not found.",
    th: "ไม่พบร้าน",
  },
  "company not found": {
    en: "Company not found.",
    th: "ไม่พบบริษัท",
  },
  "resource not found": {
    en: "The requested resource was not found.",
    th: "ไม่พบข้อมูลที่ค้นหา",
  },

  // Validation errors
  VALIDATION_ERROR: {
    en: "Please check your input and try again.",
    th: "กรุณาตรวจสอบข้อมูลที่กรอกแล้วลองอีกครั้ง",
  },
  VALIDATION_FAILED: {
    en: "Please check your input and try again.",
    th: "กรุณาตรวจสอบข้อมูลที่กรอกแล้วลองอีกครั้ง",
  },
  "invalid input": {
    en: "Invalid input. Please check your data.",
    th: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบ",
  },
  "invalid email": {
    en: "Invalid email format.",
    th: "รูปแบบอีเมลไม่ถูกต้อง",
  },
  "email already exists": {
    en: "This email is already registered.",
    th: "อีเมลนี้ถูกลงทะเบียนแล้ว",
  },
  "email already in use": {
    en: "This email is already in use.",
    th: "อีเมลนี้ถูกใช้งานแล้ว",
  },
  "password too short": {
    en: "Password must be at least 8 characters.",
    th: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
  },
  "password mismatch": {
    en: "Passwords do not match.",
    th: "รหัสผ่านไม่ตรงกัน",
  },
  "invalid role": {
    en: "Invalid role specified.",
    th: "บทบาทที่ระบุไม่ถูกต้อง",
  },
  "shop name required": {
    en: "Shop name is required.",
    th: "ต้องระบุชื่อร้าน",
  },
  "sku already exists": {
    en: "This SKU already exists.",
    th: "SKU นี้มีอยู่แล้ว",
  },
  "invalid quantity": {
    en: "Invalid quantity.",
    th: "จำนวนไม่ถูกต้อง",
  },
  "required field missing": {
    en: "Required field is missing.",
    th: "กรุณากรอกข้อมูลที่จำเป็น",
  },

  // Rate limiting
  RATE_LIMIT_EXCEEDED: {
    en: "Too many requests. Please wait a moment and try again.",
    th: "ทำรายการบ่อยเกินไป กรุณารอสักครู่แล้วลองอีกครั้ง",
  },
  TOO_MANY_REQUESTS: {
    en: "Too many requests. Please wait a moment and try again.",
    th: "ทำรายการบ่อยเกินไป กรุณารอสักครู่แล้วลองอีกครั้ง",
  },

  // Import errors
  IMPORT_ERROR: {
    en: "Import failed. Please check your file format.",
    th: "นำเข้าข้อมูลไม่สำเร็จ กรุณาตรวจสอบรูปแบบไฟล์",
  },
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
  "invalid file type": {
    en: "Invalid file type. Please upload a CSV or Excel file.",
    th: "ประเภทไฟล์ไม่ถูกต้อง กรุณาอัปโหลดไฟล์ CSV หรือ Excel",
  },

  // Network/server errors
  NETWORK_ERROR: {
    en: "Network error. Please check your connection.",
    th: "เกิดข้อผิดพลาดเครือข่าย กรุณาตรวจสอบการเชื่อมต่อ",
  },
  SERVER_ERROR: {
    en: "Server error. Please try again later.",
    th: "เกิดข้อผิดพลาดเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง",
  },
  INTERNAL_SERVER_ERROR: {
    en: "Server error. Please try again later.",
    th: "เกิดข้อผิดพลาดเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง",
  },
  BAD_GATEWAY: {
    en: "Service temporarily unavailable. Please try again later.",
    th: "บริการไม่พร้อมใช้งานชั่วคราว กรุณาลองใหม่อีกครั้ง",
  },
  SERVICE_UNAVAILABLE: {
    en: "Service temporarily unavailable. Please try again later.",
    th: "บริการไม่พร้อมใช้งานชั่วคราว กรุณาลองใหม่อีกครั้ง",
  },
  GATEWAY_TIMEOUT: {
    en: "Request timed out. Please try again.",
    th: "คำขอหมดเวลา กรุณาลองใหม่",
  },

  // Conflict errors
  CONFLICT: {
    en: "The resource already exists or was modified.",
    th: "ข้อมูลนี้มีอยู่แล้วหรือถูกแก้ไขไปแล้ว",
  },
  CONFLICT_EMAIL: {
    en: "This email is already registered.",
    th: "อีเมลนี้ถูกลงทะเบียนแล้ว",
  },
  CONFLICT_SKU: {
    en: "This SKU already exists.",
    th: "SKU นี้มีอยู่แล้ว",
  },

  // Generic/default errors
  UNKNOWN_ERROR: {
    en: "An unknown error occurred. Please try again.",
    th: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่",
  },
  "unknown error": {
    en: "An unknown error occurred. Please try again.",
    th: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่",
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

/**
 * Get user-friendly Thai error message from an error code string.
 * Defaults to Thai locale since the project is Thai-focused.
 * @param errorCode - The error code string from backend (e.g. "UNAUTHORIZED", "NOT_FOUND")
 * @param locale - Language preference (defaults to "th")
 * @returns User-friendly error message in the specified language
 */
export function getErrorMessage(errorCode: string, locale: "en" | "th" = "th"): string {
  if (!errorCode || typeof errorCode !== "string") {
    return ERROR_MESSAGES["UNKNOWN_ERROR"][locale];
  }

  const normalizedCode = errorCode.trim().toUpperCase();

  // Try exact match first
  const exactMatch = ERROR_MESSAGES[normalizedCode];
  if (exactMatch) {
    return exactMatch[locale];
  }

  // Try lowercase match for message-style keys
  const lowerCode = errorCode.trim().toLowerCase();
  const lowerMatch = ERROR_MESSAGES[lowerCode];
  if (lowerMatch) {
    return lowerMatch[locale];
  }

  // Try partial match
  const partialMatch = Object.entries(ERROR_MESSAGES).find(([key]) =>
    lowerCode.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCode)
  );
  if (partialMatch) {
    return partialMatch[1][locale];
  }

  // Fallback
  return ERROR_MESSAGES["UNKNOWN_ERROR"][locale];
}
