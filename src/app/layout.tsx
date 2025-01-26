import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";

const playfairDisplay = localFont({
  src: "./fonts/PlayfairDisplay-Variable.woff2",
  variable: "--font-playfair-display",
  weight: "100 900",
});

const heebo = localFont({
  src: "./fonts/Heebo-Variable.woff2",
  variable: "--font-heebo",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "The Agent - Open AI Assistant",
  description:
    "Open AI assistant for messaging, vision, finances, and managing your digital world.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${heebo.variable} ${playfairDisplay.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
