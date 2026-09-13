import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KUBIK Portal Demo",
  description: "Δοκιμαστικό portal ψηφιακού συνεργάτη",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="el"><body>{children}</body></html>;
}
