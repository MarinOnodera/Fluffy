import type { Metadata, Viewport } from "next";
import "./globals.css";
import { FontSizeProvider } from "@/components/FontSizeProvider";

export const metadata: Metadata = {
  title: "Fluffy — もこもこフレンド",
  description: "AIぬいぐるみとおしゃべりして、こころが軽くなるアプリ。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <FontSizeProvider>{children}</FontSizeProvider>
      </body>
    </html>
  );
}
