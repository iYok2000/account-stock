"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CommandPalette } from "./CommandPalette";

export default function LayoutWithSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div>
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      {/* Content area — offset by sidebar width on lg+ */}
      <div className="lg:pl-[280px]">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="min-h-[100vh] bg-muted/20 py-6 px-4 sm:px-6 lg:px-8">{children}</main>
      </div>
      {/* Global Cmd+K palette — rendered outside content to avoid clipping */}
      <CommandPalette />
    </div>
  );
}
