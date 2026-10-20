import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arc Asset Viewer",
  description: "Connect a browser wallet and view all token balances on Arc Testnet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
