import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "North Star Solutions | CEO Dashboard",
  description: "Internal CEO dashboard for North Star Solutions",
  icons: {
    icon: "/north-star-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Open+Sans:wght@400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-opensans antialiased min-h-screen bg-brand-bg">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
