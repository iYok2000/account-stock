"use client";

import { useState } from "react";
import { ExternalLink, Grid3X3, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface App {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  color: string;
}

const APPS: App[] = [
  {
    id: "account-stock-fe",
    name: "Inventory & Order",
    description: "Account Stock Management",
    url: "/",
    icon: "📦",
    color: "bg-primary/10 text-primary",
  },
];

const CURRENT_APP_ID = "account-stock-fe";

export default function AppSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const currentApp = APPS.find((app) => app.id === CURRENT_APP_ID);
  const otherApps = APPS.filter((app) => app.id !== CURRENT_APP_ID);

  const handleAppSwitch = (url: string) => {
    if (url.startsWith("http")) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = url;
    }
    setIsOpen(false);
  };

  if (otherApps.length === 0) {
    // ถ้าไม่มี app อื่นให้ซ่อน AppSwitcher
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-muted"
        aria-label="Switch applications"
      >
        <Grid3X3 className="size-5 text-muted-foreground" />
        <span className="hidden text-sm font-medium text-foreground md:inline">
          Apps
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="border-b border-border bg-primary/5 px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">
                Your Applications
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Switch between your apps
              </p>
            </div>

            <div className="border-b border-border bg-muted/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg text-xl",
                    currentApp?.color
                  )}
                >
                  {currentApp?.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {currentApp?.name}
                    </span>
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Current
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentApp?.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="py-2">
              {otherApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleAppSwitch(app.url)}
                  className="group flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
                >
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg text-xl transition-transform group-hover:scale-110",
                      app.color
                    )}
                  >
                    {app.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {app.name}
                      </span>
                      <ExternalLink className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="text-xs text-muted-foreground">{app.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t border-border bg-muted/50 px-4 py-3">
              <p className="text-center text-xs text-muted-foreground">
                Portal System - Switch apps in 1 click
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
