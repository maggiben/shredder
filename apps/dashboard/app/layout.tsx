import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shredder — Control tower",
  description: "Portfolio, orders, trades, and API-backed strategy context for the Shredder stack.",
  icons: {
    icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
