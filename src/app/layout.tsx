import type { Metadata, Viewport } from "next";
import "@fontsource/great-vibes/400.css";
import "@fontsource/cinzel/400.css";
import "@fontsource/cinzel/500.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500.css";
import "./globals.css";
import { weddingConfig } from "@/lib/wedding-config";

const title = "Shee Salamata & Don Vincent | Wedding Invitation";
const description = "Together with our families, we joyfully invite you to celebrate our Wedding on December 17, 2026: wedding ceremony at Kigali City Hall at 3:00 PM, followed by a reception at Kigali Serena Hotel at 4:30 PM.";
export const metadata: Metadata = {
  title, description,
  ...(weddingConfig.publicBaseUrl ? { metadataBase: new URL(weddingConfig.publicBaseUrl), alternates: { canonical: "/" } } : {}),
  openGraph: { title, description, type: "website", locale: "en_RW", siteName: "Shee Salamata & Don Vincent" },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#F8F4EC" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a href="#main-content" className="skip-link">Skip to invitation</a>{children}</body></html>;
}
