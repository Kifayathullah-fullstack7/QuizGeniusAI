import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/shared/ClientProviders";
import GalaxyBackground from "@/components/GalaxyBackground";
import CosmicCursor from "@/components/CosmicCursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Academic Portal & QuizGenius AI",
  description: "Role-based administrative and student portal with AI cognitive diagnostics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#000000] text-[#FFFFFF] selection:bg-violet-500 selection:text-white relative">
        {/* Futuristic Cosmic Animated Cursor */}
        <CosmicCursor />

        {/* Full-screen Galaxy WebGL Background across all pages */}
        <GalaxyBackground />

        {/* Foreground Content Stack */}
        <div className="relative z-10 flex flex-col min-h-full flex-1">
          <ClientProviders>
            {children}
          </ClientProviders>
        </div>
      </body>
    </html>
  );
}
