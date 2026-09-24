import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PWAProvider } from "@/components/pwa/PWAProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Smart Finance — Aplikasi Pengelola & Catatan Keuangan Pribadi",
    template: "%s | Smart Finance",
  },
  description:
    "Kelola pemasukan, pengeluaran, tabungan, dan kantong dana dengan mudah.",
  applicationName: "Smart Finance",
  authors: [{ name: "Smart Finance Team" }],
  generator: "Next.js",
  manifest: "/manifest.webmanifest",
  keywords: [
    "Smart Finance",
    "Personal Finance App",
    "Aplikasi Keuangan Pribadi",
    "Catat Pemasukan Pengeluaran",
    "Kantong Dana",
    "Budget Tracker",
    "Kalkulator Tabungan",
    "PWA Finance",
  ],
  creator: "Smart",
  publisher: "Smart Finance",
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Aloka",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://aloka-finance.vercel.app",
    title: "Smart Finance — Personal Finance & Pocket Tracker",
    description:
      "Kelola pemasukan, pengeluaran, tabungan, dan kantong dana dengan mudah.",
    siteName: "Smart Finance",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Finance — Personal Finance & Pocket Tracker",
    description:
      "Kelola pemasukan, pengeluaran, tabungan, dan kantong dana dengan mudah.",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/images/logoo.png", type: "image/png" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/icons/icon-192.png",
    apple: [
      { url: "/icons/apple-touch-icon.png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning className={poppins.variable}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Aloka" />
        <link rel="icon" href="/icons/icon-192.png" type="image/png" />
        <link rel="shortcut icon" href="/icons/icon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-zinc-50 font-sans antialiased text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 selection:bg-blue-500 selection:text-white"
      >
        <ThemeProvider>
          <PWAProvider>{children}</PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
