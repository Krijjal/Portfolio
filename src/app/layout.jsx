import localFont from "next/font/local";
import { site } from "@/data/site";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SkipLink } from "@/components/SkipLink";
import { Splash } from "@/components/Splash";
import BlueSparksCanvas from "@/components/BlueSparksCanvas";
import "./globals.css";

/** Sole site face — headlines, body, and tags. Bold is the heaviest cut available (no extrabold in this family). */
const bankGothic = localFont({
  src: [
    { path: "../fonts/BankGothicLightRegular.otf", weight: "300", style: "normal" },
    { path: "../fonts/BankGothicMediumBT.ttf", weight: "500", style: "normal" },
    { path: "../fonts/BankGothicBold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-bank-gothic",
  display: "swap",
});

const rootTitle = `${site.name} | ${site.title}`;
const assetBase = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata = {
  title: {
    default: rootTitle,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: site.keywords,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  metadataBase: new URL(site.url),
  openGraph: {
    title: rootTitle,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: site.locale.replace("_", "-"),
    type: "website",
    images: site.ogImage
      ? [{ url: site.ogImage, width: 1200, height: 630, alt: `${site.name} portfolio preview` }]
      : undefined,
  },
  twitter: {
    card: "summary_large_image",
    title: rootTitle,
    description: site.description,
    images: site.ogImage ? [site.ogImage] : undefined,
  },
  icons: {
    icon: [{ url: `${assetBase}/favicon.svg`, type: "image/svg+xml" }],
    shortcut: [`${assetBase}/favicon.svg`],
    apple: [{ url: `${assetBase}/favicon.svg`, type: "image/svg+xml" }],
  },
  robots: { index: true, follow: true },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${site.url}#person`,
        name: site.name,
        jobTitle: site.title,
        description: site.description,
        url: site.url,
        sameAs: [site.linkedin, site.github, site.twitter].filter(Boolean),
        knowsAbout: site.keywords,
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}#website`,
        name: `${site.name} portfolio`,
        url: site.url,
        description: site.description,
        inLanguage: "en-US",
        publisher: { "@id": `${site.url}#person` },
      },
    ],
  };

  return (
    <html lang="en" className={bankGothic.variable}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="min-h-screen font-sans">
        <BlueSparksCanvas />
        <SkipLink />
        <Splash />
        <Navbar />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
