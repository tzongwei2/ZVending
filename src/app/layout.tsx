import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";
import { Providers } from "@/components/providers";
import { Sidebar, MobileSidebar } from "@/components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zvending - Vending Machine Management",
  description: "Manage your vending machines, inventory, and sales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 md:pl-64">
              <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background px-4 md:hidden">
                <MobileSidebar />
                <Link href="/" className="flex items-center">
                  <Image
                    src="/logo.png"
                    alt="Z Vending"
                    width={120}
                    height={32}
                    className="h-8 w-auto"
                  />
                </Link>
              </header>
              <div className="container mx-auto p-4 md:p-6">{children}</div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
