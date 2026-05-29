import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Valentina Architecture Archive",
  description: "A building database focused on architectural detail — architect, style, materials, year built.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
