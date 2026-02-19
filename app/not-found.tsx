import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <html lang="th">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#faf9f7" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            textAlign: "center",
            padding: "1rem",
            color: "#1c1310",
          }}
        >
          <p style={{ fontSize: "6rem", fontWeight: 900, color: "#d4d4d8", lineHeight: 1, marginBottom: "1rem" }}>
            404
          </p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            ไม่พบหน้าที่ต้องการ
          </h1>
          <p style={{ color: "#71717a", marginBottom: "2rem", maxWidth: 320 }}>
            หน้าที่คุณค้นหาไม่มีอยู่ในระบบ
          </p>
          <Link
            href="/th"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1.25rem",
              borderRadius: "0.5rem",
              background: "hsl(25 55% 38%)",
              color: "white",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </body>
    </html>
  );
}
