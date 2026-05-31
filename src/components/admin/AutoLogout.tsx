"use client";

import { useEffect } from "react";

export function AutoLogout() {
  useEffect(() => {
    // 1. Check if the page was loaded due to a reload/refresh
    let isReload = false;
    try {
      const entries = performance.getEntriesByType("navigation");
      if (entries.length > 0) {
        isReload = (entries[0] as PerformanceNavigationTiming).type === "reload";
      } else {
        // Fallback for older browsers
        isReload = performance.navigation.type === 1; // TYPE_RELOAD
      }
    } catch (e) {
      // Ignore
    }

    if (isReload) {
      // Call logout and redirect to login page immediately
      fetch("/api/auth/logout", { method: "POST" })
        .then(() => {
          window.location.href = "/admin/login";
        })
        .catch(() => {
          window.location.href = "/admin/login";
        });
      return;
    }

    // 2. Register beforeunload listener for closing tab or other external navigations
    const handleUnload = () => {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/auth/logout");
      } else {
        fetch("/api/auth/logout", { method: "POST", keepalive: true }).catch(() => {});
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  return null;
}
