/**
 * Helpers for chart narrative text (insight ใต้ chart).
 * ใช้กับ profitability และ analytics อื่นที่ต้องการข้อความสรุปตามข้อมูล
 */

export function profitMarginNarrative(avgMargin: number | null): string | null {
  if (avgMargin === null || avgMargin === undefined) return null;
  if (avgMargin < 0) return "อัตรากำไรเฉลี่ยติดลบ — ควรตรวจสอบต้นทุนและราคาขาย";
  if (avgMargin < 10) return "อัตรากำไรเฉลี่ยต่ำ — พิจารณาปรับราคาหรือลดต้นทุน";
  if (avgMargin < 20) return "อัตรากำไรเฉลี่ยอยู่ในเกณฑ์ปานกลาง — พยายามเพิ่มให้ได้ 20% ขึ้นไป";
  return "อัตรากำไรเฉลี่ยอยู่ในเกณฑ์ดี";
}

export function marginTrendNarrative(trend: "up" | "down" | "stable"): string | null {
  switch (trend) {
    case "up":
      return "แนวโน้ม margin ดีขึ้น";
    case "down":
      return "แนวโน้ม margin ลดลง — ควรติดตาม";
    case "stable":
      return "แนวโน้ม margin คงที่";
    default:
      return null;
  }
}
