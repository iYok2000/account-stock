"use client";

import { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function LayoutWithSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  // Desktop เปิด default, Mobile ปิด default
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // ถ้าหน้าจอเล็กกว่า md (768px) ให้ปิด sidebar
    const handleResize = () => {
      if (window.innerWidth < 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header เต็มความกว้าง — logo ซ้ายสุด ไม่ถูก sidebar ดัน (ทับด้านบน) */}
      <Header
        onMenuClick={() => setSidebarOpen((o) => !o)}
        sidebarOpen={sidebarOpen}
      />

      {/* Mobile: Drawer overlay */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={true}
      />

      <div className="flex flex-1">
        {/* Desktop: sidebar ปกติ (ใน flow, ดัน content) */}
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMobile={false}
        />

        <main className="flex-1 bg-neutral-50 pb-8 md:pb-10">
          <div className="page-container">{children}</div>
        </main>
      </div>
    </div>
  );
}
