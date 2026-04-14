import type { Metadata } from "next";
import { Nunito, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
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
  title: "ZIPIR! | Kelime Oyunu",
  description: "Bugün hiç harf almadan tamamlayabilecek misin? Hadi arkadaşlarına meydan oku!",
  openGraph: {
    title: "ZIPIR! | Kelime Oyunu",
    description: "Bugün hiç harf almadan tamamlayabilecek misin? Hadi arkadaşlarına meydan oku!",
    siteName: "ZIPIR!",
    locale: "tr_TR",
    type: "website",
    url: "https://zipir.app",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ZIPIR! Kelime Oyunu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZIPIR! | Kelime Oyunu",
    description: "Bugün hiç harf almadan tamamlayabilecek misin? Hadi arkadaşlarına meydan oku!",
    images: ["/og-image.jpg"],
  },
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
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
