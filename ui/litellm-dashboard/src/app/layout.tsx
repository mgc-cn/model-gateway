import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import AntdGlobalProvider from "@/contexts/AntdGlobalProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import ReactQueryProvider from "@/contexts/ReactQueryProvider";
import I18nProvider from "@/i18n/I18nProvider";
import { defaultLocale } from "@/i18n/config";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LiteLLM Dashboard",
  description: "LiteLLM Proxy Admin UI",
  icons: { icon: "/get_favicon" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={defaultLocale}>
      <body className={inter.className}>
        <I18nProvider>
          <ReactQueryProvider>
            <AntdGlobalProvider>
              <AuthProvider>{children}</AuthProvider>
            </AntdGlobalProvider>
          </ReactQueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
