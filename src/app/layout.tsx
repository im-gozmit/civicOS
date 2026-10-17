import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const display = Fraunces({ variable: "--font-display", subsets: ["latin"], style: ["normal", "italic"] });
// Hindi text: without this the browser would fall back to a plain system font.
const deva = Noto_Sans_Devanagari({ variable: "--font-deva", subsets: ["devanagari"] });

export const metadata: Metadata = {
  title: { default: "Sudhaar: Report. Track. Resolve.", template: "%s · Sudhaar" },
  description:
    "Report a pothole, garbage pile, blocked drain or broken street light in Prayagraj with a photo. AI suggests the right team, staff verify it, and you get updates on WhatsApp.",
  applicationName: "Sudhaar",
};

export const viewport: Viewport = {
  themeColor: "#cf3d0f",
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
