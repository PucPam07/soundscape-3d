import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoundScape 3D - Interactive 3D Audio Visualizer",
  description: "Interactive 3D WebGL & Web Audio Visualizer built with Next.js, Three.js, and custom shaders",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden bg-[#11101d]">{children}</body>
    </html>
  );
}
