import type { Metadata, Viewport } from "next";
import { Nunito, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "next-themes";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "ZIPIR! - Kelime Oyunu",
  description: "Her gün 14 yeni soru, 4 dakika. Bugün hiç harf almadan tamamlayabilecek misin? Haydi arkadaşlarına meydan oku!",
  metadataBase: new URL("https://zipir.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ZIPIR! - Kelime Oyunu",
    description: "Her gün 14 yeni soru, 4 dakika. Bugün hiç harf almadan tamamlayabilecek misin? Haydi arkadaşlarına meydan oku!",
    url: "https://zipir.app",
    siteName: "ZIPIR!",
    locale: "tr_TR",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ZIPIR! Kelime Oyunu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZIPIR! - Kelime Oyunu",
    description: "Her gün 14 yeni soru, 4 dakika. Bugün hiç harf almadan tamamlayabilecek misin? Haydi arkadaşlarına meydan oku!",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${nunito.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#7c3aed" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="h-dvh font-sans">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
