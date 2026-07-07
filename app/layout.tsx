import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import Nav from "./components/Nav";
import PageTransition from "./components/PageTransition";
import MainWithAuth from "./components/MainWithAuth";
import { getSession } from "@/lib/auth";
import { getTituloApp, getDescripcionApp } from "@/lib/raf-config";

export const metadata: Metadata = {
  title: getTituloApp(),
  description: getDescripcionApp(),
  applicationName: getTituloApp(),
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "192x192" }],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#8e8e93",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("raf_session")?.value ?? null);

  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-icon.png" sizes="180x180" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preload" href="/Logtipo_EscudoColor.png" as="image" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="antialiased">
        <div className="app-shell">
          <MainWithAuth>
            <PageTransition>{children}</PageTransition>
          </MainWithAuth>
          <Nav session={session} />
        </div>
      </body>
    </html>
  );
}
