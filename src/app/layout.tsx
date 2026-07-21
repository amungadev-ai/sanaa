import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sanaathrumylens.co.ke'),
  other: {
    'google-adsense-account': 'ca-pub-8031704055036556',
  },
  title: {
    default: "Sanaa Through My Lens — Arts & Culture Blog",
    template: "%s | Sanaa Through My Lens",
  },
  description:
    "An arts & culture opinion blog highlighting stories around the art scene in Kenya and East Africa — music, film, book reviews, commentary, events, and infortainment.",
  keywords: [
    "Sanaa Through My Lens",
    "Kenya arts",
    "East Africa culture",
    "Kenyan music",
    "African film",
    "Nairobi art",
    "gengetone",
    "Afrofuturism",
    "literature Kenya",
  ],
  authors: [{ name: "Sanaa Through My Lens" }],
  openGraph: {
    title: "Sanaa Through My Lens — Arts & Culture Blog",
    description:
      "An arts & culture opinion blog highlighting stories around the art scene in Kenya and East Africa.",
    url: "https://sanaathrumylens.co.ke",
    siteName: "Sanaa Through My Lens",
    type: "website",
    locale: "en_KE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sanaa Through My Lens — Arts & Culture Blog",
    description:
      "An arts & culture opinion blog highlighting stories around the art scene in Kenya and East Africa.",
    creator: "@sanaalens",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8031704055036556"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
