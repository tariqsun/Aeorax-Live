import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aeorax Live — Managed BigBlueButton Control Plane",
  description: "Enterprise multi-tenant BigBlueButton classroom hosting and quota management for colleges.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
