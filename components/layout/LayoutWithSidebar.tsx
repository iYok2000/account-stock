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
      <Header onMenuClick={() => setSidebarOpen((o) => !o)} sidebarOpen={sidebarOpen} />
      
      {/* Mobile Sidebar (overlay) */}
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isMobile={true}
      />
      
      <div className="flex flex-1">
        {/* Desktop Sidebar (collapsible, sticky top-0 ไม่เว้น header) */}
        <Sidebar 
          open={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isMobile={false}
        />
        
        {/* Main Content (เว้น header ด้วย pt-) */}
        <main className="flex-1 bg-neutral-50 pb-6 pt-8 md:pb-8 md:pt-10">
          <div className="page-container">{children}</div>
        </main>
      </div>
    </div>
  );
}
