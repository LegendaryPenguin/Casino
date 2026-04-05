import type { Metadata } from "next";
import { Cinzel, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Casino Explorer",
    template: "%s · Casino Explorer",
  },
  description:
    "Browse casinos, games, and players from your MySQL data — premium dashboard experience.",
  icons: {
    icon: "/casino-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="relative z-[1] flex min-h-full flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col">{children}</main>
        <Toaster richColors position="top-center" theme="dark" />
      </body>
    </html>
  );
}
