import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { AppProvider } from "@/lib/store";
import { ToastProvider } from "@/components/ui/toast";
import { DemoPanel } from "@/components/demo-panel";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["opsz"], display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "U-Frost ID — Frozen food dikirim -18°C", template: "%s · U-Frost ID" },
  description: "Ayam, daging, seafood & olahan beku. Harga per pack dan per kg, dikirim dengan box insulated + ice gel.",
};

export const viewport: Viewport = { themeColor: "#0E4B45", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <AppProvider>
          <ToastProvider>
            {children}
            <DemoPanel />
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}
