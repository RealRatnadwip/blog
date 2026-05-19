import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blog Desktop",
  description: "A Linux Mint styled blog experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className="h-full overflow-hidden"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
