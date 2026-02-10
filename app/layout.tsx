import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import FloatingSprites from "./components/FloatingSprites";

const milkyBlend = localFont({
  src: "../public/Milky_Blend.otf",
  variable: "--font-milky-blend",
});

export const metadata: Metadata = {
  title: "Sellybean's Turtle App",
  description: "Turtle App",
  icons: {
    icon: '/turtle_favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${milkyBlend.variable} font-milky-blend antialiased`}>
        <FloatingSprites />
        {children}
      </body>
    </html>
  );
}
