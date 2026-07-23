import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { RegisterSW } from "./register-sw";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aisle List — Voice Shopping List",
  description:
    "Dictate your shopping list as you walk around the kitchen. Items are sorted into supermarket aisles so you can tick them off in order.",
  appleWebApp: {
    capable: true,
    title: "Aisle List",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

// Until Clerk keys are provisioned, run without the provider so the app
// still works in guest/local-only mode.
const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const page = (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
  if (!clerkConfigured) return page;
  return (
    <ClerkProvider
      appearance={{ variables: { colorPrimary: "#10b981" } }}
    >
      {page}
    </ClerkProvider>
  );
}
