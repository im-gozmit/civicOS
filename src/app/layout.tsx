import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const display = Plus_Jakarta_Sans({ variable: "--font-display", subsets: ["latin"], weight: ["600", "700", "800"] });
// Hindi text: without this the browser would fall back to a plain system font.
const deva = Noto_Sans_Devanagari({ variable: "--font-deva", subsets: ["devanagari"] });

export const metadata: Metadata = {
  title: { default: "CivicOS: Report. Track. Resolve.", template: "%s · CivicOS" },
  description:
    "Report a pothole, garbage pile, blocked drain or broken street light in Prayagraj with a photo. AI suggests the right team, staff verify it, and you get updates on WhatsApp.",
  applicationName: "CivicOS",
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} ${deva.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
