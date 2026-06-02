"use client";

import React, { useState, useEffect } from "react";
import { SplashScreen } from "./SplashScreen";
import { DashboardNavigation } from "./DashboardNavigation";
import { usePathname } from "next/navigation";

export function AppContentWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    
    // Check if splash parameter is set in URL to force replay
    const params = new URLSearchParams(window.location.search);
    if (params.get("splash") === "true") {
      sessionStorage.removeItem("kahawa-splash-played");
      setShowSplash(true);
      return;
    }

    // Check if splash has already played in this browser session
    const hasPlayed = sessionStorage.getItem("kahawa-splash-played");
    if (hasPlayed) {
      setShowSplash(false);
    }
  }, []);

  if (!mounted) {
    // Keep a simple background color match while hydration finishes
    return <div className="min-h-screen bg-[#051007] text-[#F5F3FF]">{children}</div>;
  }

  const isGuestPage = pathname === "/" || pathname === "/checkout";

  return (
    <>
      <div className="block min-h-screen">
        <DashboardNavigation />
        <div className={isGuestPage ? "" : "md:pl-64 pt-16 md:pt-0 pb-16 md:pb-0 min-h-screen"}>
          {children}
        </div>
      </div>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
    </>
  );
}

