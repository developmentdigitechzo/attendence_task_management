import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Roboto_Slab } from "next/font/google";
import "./globals.css";

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Slab display face echoes the bold wordmark in the Digitechzo logo
const display = Roboto_Slab({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Digitechzo WorkOS | Internal Employee Management & Productivity System",
  description:
    "Digitechzo WorkOS replaces WhatsApp and manual attendance tracking with streamlined attendance, task management, internal communication, and productivity insights.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
