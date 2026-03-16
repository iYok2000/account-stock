import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("common");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
        <FileQuestion className="h-10 w-10 text-muted-foreground" />
      </div>

      <p className="text-6xl font-black text-muted-foreground/30 mb-4 tabular-nums">404</p>

      <h2 className="text-2xl font-bold text-foreground mb-2">ไม่พบหน้าที่ต้องการ</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-8">
        หน้าที่คุณค้นหาอาจถูกลบ เปลี่ยนชื่อ หรือไม่มีอยู่ในระบบ
      </p>

      <div className="flex gap-3">
        <Link href="/" className="btn-primary flex items-center gap-2">
          <Home className="h-4 w-4" />
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
