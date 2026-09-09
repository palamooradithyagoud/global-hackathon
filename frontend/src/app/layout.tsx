import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import BottomBar from "@/components/layout/BottomBar";

export const metadata: Metadata = {
  title: "ASCEND — Student Career & Education Intelligence",
  description:
    "An AI-powered student career and education navigation platform mapping verified profiles to curated scholarships and institutional pathways.",
  icons: {
    icon: "/favicon.ico",
    apple: "/ascend-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-full flex flex-col antialiased bg-[#0C0C10] text-[#F4F4F6] bg-mesh-dark">
        <Navbar />
        <main className="flex-1 flex flex-col pb-28">{children}</main>
        <BottomBar />
      </body>
    </html>
  );
}
