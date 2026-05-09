import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.agrinexus.law",
  appName: "AgriNexus.Law",
  webDir: ".next",
  server: {
    // Store builds load the live secure deployment.
    url: "https://agrinexuslaw.com",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#fafaf9",
      showSpinner: false,
    },
  },
};

export default config;
