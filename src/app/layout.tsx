import type { Metadata } from "next";
import { Patrick_Hand, Poppins, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { ToastContainer } from "@/components/ui/Toast";
import { IntroAnimation } from "@/components/brand/IntroAnimation";
import { site } from "@content/site";

// Fonts
const patrickHand = Patrick_Hand({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hand-loaded",
  display: "swap",
});

const poppins = Poppins({
  weight: ["300", "400"],
  subsets: ["latin"],
  variable: "--font-label-loaded",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${site.wordmark} — ${site.shortTagline}`,
    template: `%s | ${site.wordmark}`,
  },
  description: site.description,
  keywords: ["handmade", "artisan", "bags", "footwear", "souvenirs", "india", "curated"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://rastahse.com",
    siteName: site.name,
    title: `${site.wordmark} — ${site.shortTagline}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.wordmark} — ${site.shortTagline}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.ico",
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
      className={`${patrickHand.variable} ${poppins.variable} ${inter.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (window.location.pathname === '/' && !sessionStorage.getItem('rastah_intro_seen')) {
                  document.documentElement.classList.add('intro-pending');
                }
              } catch(e) {}
            `,
          }}
        />
        {/* Override font variables with loaded fonts */}
        <style>{`
          :root {
            --font-hand: var(--font-hand-loaded), 'Patrick Hand', cursive;
            --font-label: var(--font-label-loaded), 'Poppins', sans-serif;
            --font-body: var(--font-body-loaded), 'Inter', sans-serif;
          }
          html.intro-pending body {
            overflow: hidden;
            background-color: #f8f4f1;
          }
          html.intro-pending #site-main-content {
            opacity: 0;
          }
        `}</style>
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <IntroAnimation />
        <Header />
        <main id="site-main-content" className="flex-1 pt-16 md:pt-20">
          {children}
        </main>
        <Footer />
        <CartDrawer />
        <ToastContainer />
      </body>
    </html>
  );
}
