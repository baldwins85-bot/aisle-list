import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.aislelist.app",
  appName: "Aisle List",
  // A tiny local shell is bundled as a fallback; live content is loaded
  // from the deployed site so auth, sync, and the API keep working.
  webDir: "capacitor-shell",
  server: {
    url: "https://aisle-list.vercel.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
  },
};

export default config;
