import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Ensure this path exactly matches your file structure for the CartContext
import { CartProvider } from "./components-main/CartContext";
import { AuthProvider } from "./context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "REmise",
  description: "Everything, Delivered — Groceries, cosmetics, fashion, electronics & more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* The CartProvider is placed at the absolute root.
          This ensures that NavbarHome, CategoryPage, and ProductDetailPage
          all share the same cart state and can open the CartDrawer.
        */}
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}