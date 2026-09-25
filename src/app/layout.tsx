import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/instellingen/AppProvider";
import { THEMA_SCRIPT } from "@/lib/instellingen/themaScript";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WEERGAVE_SCRIPT } from "@/components/weergaveScript";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-app",
  display: "swap",
});

// De naam en de taal komen uit het beheer en worden in de browser gezet (AppProvider).
// Wat hier staat, ziet alleen wie de pagina zonder JavaScript opvraagt.
export const metadata: Metadata = {
  title: "OpenLab",
  description: "Digital learning activities, live classroom tools and practice for every lesson.",
  applicationName: "OpenLab",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: de scripts hieronder zetten attributen en kleuren op <html>
    // vóór React hydrateert. Dat is precies de bedoeling, maar React ziet het als verschil.
    <html lang="nl" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Zet weergave en kleuren vóór de eerste tekening, anders springt de pagina om. */}
        <script dangerouslySetInnerHTML={{ __html: WEERGAVE_SCRIPT + THEMA_SCRIPT }} />
      </head>
      <body className="min-h-dvh flex flex-col antialiased">
        <AppProvider>
          <AuthProvider>
            <Header />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </AppProvider>
      </body>
    </html>
  );
}
