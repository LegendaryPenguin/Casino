import type { Metadata } from "next";
import { Cinzel, DM_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
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
    default: "Casino, Inc.",
    template: "%s · Casino, Inc.",
  },
  description:
    "Browse casinos, games, and players from your MySQL data — premium dashboard experience.",
  icons: {
    icon: "/casino-icon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = getUserBySessionToken(token);

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="relative z-[1] flex min-h-full flex-col">
        <Navbar user={user} />
        <main className="flex flex-1 flex-col">{children}</main>
        <Toaster richColors position="top-center" theme="dark" />
      </body>
    </html>
  );
}
