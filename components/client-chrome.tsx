"use client";

import { AnalyticsLoader } from "@/components/analytics-loader";
import { CommandPalette } from "@/components/command-palette";
import { ConditionalLayout } from "@/components/conditional-layout";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { MobileActionDock } from "@/components/mobile-action-dock";
import { PwaHelpButton } from "@/components/pwa-help-button";
import { PwaOnboarding } from "@/components/pwa-onboarding";
import { PwaRegister } from "@/components/pwa-register";
import { SiteVisitTracker } from "@/components/site-visit-tracker";
import { ThemeToggle } from "@/components/theme-toggle";

/** Global UI chrome — client-only to avoid prerender failures on /_not-found. */
export function ClientChrome() {
  return (
    <>
      {/* Тези компоненти трябва да работят НА ВСЯКА страница, включително на началната страница (/) */}
      <PwaRegister />
      <PwaOnboarding />
      <CookieConsentBanner />
      <AnalyticsLoader />
      <SiteVisitTracker />

      {/* Тези компоненти се скриват на началната страница (/) за по-чист изглед */}
      <ConditionalLayout>
        <CommandPalette />
        <MobileActionDock />
        <PwaHelpButton />
        <ThemeToggle />
      </ConditionalLayout>
    </>
  );
}
