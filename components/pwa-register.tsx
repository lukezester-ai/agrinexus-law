"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __deferredPwaPrompt?: any;
  }
}

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("SW reg failed:", err);
      });
    }

    const handleBeforeInstallPrompt = (e: any) => {
      // Предотвратяваме автоматичния мини-банер в Chrome/Edge и запазваме събитието
      e.preventDefault();
      window.__deferredPwaPrompt = e;
      window.dispatchEvent(new Event("agrinexus:pwa-installable"));
    };

    const handleAppInstalled = () => {
      window.__deferredPwaPrompt = undefined;
      window.dispatchEvent(new Event("agrinexus:pwa-installed"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return null;
}
